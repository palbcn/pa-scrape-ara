/*
 scraper ara.cat/opinio
 pa bcn
*/
const request = require("superagent");
const cheerio = require("cheerio");
const fs = require("fs/promises");

/******************************************************************/
const ARTICLES_JSON_FN = '.data/ara-articles.json';

let allArticles = [];
let modifiedArticles = false;
/*---------------------------------------------*/
async function readArticles() {
  try {
    let jsontxt = await fs.readFile(ARTICLES_JSON_FN,'utf8');
    let articles = JSON.parse(jsontxt);
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
    console.error('readPage',err);
    return '';
  }
}
   
/******************************************************************/   
function extractLinks(s) {
	let $ = cheerio.load(s);
	let links = $("a").toArray().map( an => {
    return { 
      title: $(an).attr("title") || $(an).text(), 
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
  console.log(links.length);
  return links;
}

function extractSelectorText($, selector) {
  let selected = $(selector);
  let texts = selected.map((indx, el) => {
    let $el = $(el);
    let txt = $el.text();
    txt = txt.replace(/\t/g, ' ')       // replace tabs
      .replace(/ *(\n|\r|\r\n) */g, '\n')
      .replace(/\n+(?=\n)/g, '') // Replace multiple lines with single line 
      .replace(/ +(?= )/g, '');  // Replace multiple spaces with single space 
    return txt;
  });
  return texts.get().join('\n').trim();
}

/******************************************************************/
const TESTDATE = /\d+\/\d+\/\d{4}/;
async function scrapeArticle(url) {
  let res = await request(url);
  let html = res.text;
  let $ = cheerio.load(html);
  let title = extractSelectorText($,".ara-opening-info h1.title");
  let content = extractSelectorText($, ".ara-body p");
  let author = $(".opinion-authors a.name").text().trim();
  let date = $(".ara-opening-info span.date").text().trim();
  if (TESTDATE.test(date)) {
    let [dd,mm, yyyy] = date.split("/");
    let newdate = new Date(yyyy, mm - 1, dd);
    date = newdate.getTime();
  } else {
    date = Date.now();
  }
  return { title, author, date, content };  
}

const ROOT = "https://ara.cat/opinio";
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
      let article = await scrapeArticle(link.href);
      setArticle(link.hash, { ...link, ...article });
    }
  }
}

/******************************************************************/
async function init() {
  allArticles = await readArticles();
  modifiedArticles = false;
  let links = await scrapeLinks();
  await downloadLinks(links);
  if (modifiedArticles) await writeArticles(allArticles);
  return allArticles;
}

/******************************************************************/
module.exports = init;
