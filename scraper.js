/*
 scraper ara.cat/opinio
 pa bcn
*/

const request = require("superagent");
const cheerio = require("cheerio");
const fs = require("fs/promises");

const ROOT = "https://ara.cat/opinio";
const TESTDATE = /\d+\/\d+\/\d{4}/;


/******************************************************************/
ARTICLES_JSON_FN = '.data/ara-articles.json';
let allArticles = [];
let modifiedArticles = false;
/*---------------------------------------------*/
async function readArticles() {
  try {
    let jsontxt = await fs.readFile(ARTICLES_JSON_FN,'utf8');
    let articles = JSON.parse(jsontxt);
    console.log(ARTICLES_JSON_FN,'read',articles.length,'articles');
    if (!Array.isArray(articles)) return [];
    articles.sort ( (a,b) => parseInt(a.hash,16) - parseInt(b.hash,16) );
    return articles;
  } catch (err) {
    console.error(err);
    return [];
  }
}
async function writeArticles(articles) {
  try {
    let jsontxt = JSON.stringify(articles);
    await fs.writeFile(ARTICLES_JSON_FN,jsontxt,'utf8');    
    modifiedArticles = false;
  } catch (err) {
    console.error(err);  
  }
}
/*---------------------------------------------*/
function findArticle(hash) {  // binary search in a sorted array
  let start=0;
  let end=allArticles.length-1;
  while (start<=end){
    let mid=Math.floor((start + end)/2);
    if (allArticles[mid].hash===hash) return mid;
    else if (allArticles[mid].hash < hash) start = mid + 1;
    else end = mid - 1;
  }
  return -start-1;  // to indicate a possible insertion point (-1 for the special 0 case)
}
function getArticle(hash) {
  let idx = findArticle(hash);
  if (idx>=0) return allArticles[idx];
  else return null;
}
function setArticle(hash,article) {
  let idx = findArticle(hash);
  article.hash = hash;
  modifiedArticles = true;  
  if (idx>=0) {    
    allArticles[idx]=article;
  } else {
    allArticles.splice(-idx-1,0,article);
  }
}

/******************************************************************/
// https://en.wikipedia.org/wiki/Jenkins_hash_function
function jenkinsHash(str){ 
  let a=0;   
  for (let i=0; i<str.length; i++) {
    a+=str.charCodeAt(i);
    a+=a<<10; a^=a>>6;
  }
  a+=a<<3; a^=a>>11;
  a+=(a<<15)&4294967295;
  return a>>>0;
} 
function hash(str) {
  return jenkinsHash(str).toString(16).padStart(8, '0');
}
function hashToInt(str) {
  return parseInt(str,16);
}

/******************************************************************/
async function readPage(url) {
  try {
    let res = await request(url);
    return res.text;
  } catch(err) {
    return '';
  }
}
   
/******************************************************************/   
function extractLinks(s) {
	let $ = cheerio.load(s);
	let links = $("a").toArray().map( an => {
    return { 
      title: $(an).text(), 
      href: $(an).attr("href"),
      hash: hash($(an).attr("href"))
    }
  });
  links.map( link => {
    link.title = link.title
      .replace(/^\s+|\s+$/gm, '')
      .replace(/\s+/gm,' ');
    return link;
  });
	links = links.filter( link => 
    (link.href !== undefined) && 
    (link.href !== '') && 
    (link.href.endsWith('.html')) && 
    (link.title !== '')
  );
  return links;
}

function extractSelectorText(html,selector){
  let $ = cheerio.load(html);
  let selected = $(selector);
  return selected.text()
        .replace(/\t/g, ' ')       // replace tabs
        .replace(/ *(\n|\r|\r\n) */g, '\n')
        .replace(/\n+(?=\n)/g, '') // Replace multiple lines with single line 
        .replace(/ +(?= )/g, '');  // Replace multiple spaces with single space 
}

/******************************************************************/
async function scrapeArticle(url) {
  let res = await request(url);
  let html = res.text;
  let txt = extractSelectorText(html,"main");
  return txt;  
}

async function scrapeLinks() {
  let html = await readPage(ROOT);
  let links = extractLinks(html);
  return links;
}

/******************************************************************/
async function downloadLinks(links) {
  for (const link of links) {
    let item = getArticle(link.hash);
    if (item==null) {    // not already downloaded        
      let content = await scrapeArticle(link.href);
      let lines = content.split('\n');
      let date = lines[2];
      let author = lines[1];
      if (TESTDATE.test(date)) {
        let ddmmyyyy = date.split("/");
        let newdate = new Date(ddmmyyyy[2], ddmmyyyy[1] - 1, ddmmyyyy[0]);
        link.date = newdate.getTime();
        link.author = author;
      } else {
        link.author = "";
        link.date = Date.now();
      }
      setArticle(link.hash,{...link,content});
    }
  }
}


/******************************************************************/
async function init() {
  console.log('scraper init');
  allArticles = await readArticles();
  modifiedArticles = false;
  let links = await scrapeLinks();
  await downloadLinks(links);
  if (modifiedArticles) await writeArticles(allArticles);
  return allArticles;
}

/******************************************************************/
module.exports = init;
