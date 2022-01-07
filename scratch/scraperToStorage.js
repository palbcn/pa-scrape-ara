/*
 scraper ara.cat/opinio
 pa bcn
*/

const request = require("superagent");
const cheerio = require("cheerio");
const {LocalStorage} = require("node-localstorage");
let localStorage = new LocalStorage('./.data'); 

const ROOT = "https://ara.cat/opinio";
const TESTDATE = /\d+\/\d+\/\d{4}/;

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

/******************************************************************/
async function readIndex(url) {
  let res = await request(url);
  return res.text;
}
      
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
  let html = await readIndex(ROOT);
  let links = extractLinks(html);
  return links;
}

/******************************************************************/
async function downloadLinks(links) {
  for (const link of links) {
    let item = localStorage.getItem(link.hash);
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
      localStorage.setItem(link.hash,JSON.stringify({...link,content}));
    }
  }
}

function getAllArticles() {
  let all = [];
  let nkeys = localStorage.length;
  for (let i=0; i<nkeys; i++) {
    let hash = localStorage.key(i);
    let item = localStorage.getItem(hash);
    let article = JSON.parse(item);
    all.push({index:i,...article});
  }
  all.sort ( (a,b) => a.date - b.date )
  return all;
}

if (require.main === module) {  
  (async function main() {    
    try {
      let links = await scrapeLinks();
      await downloadLinks(links);          
    } catch(err) {
      console.error(err)
    }
  })()
  
} else {
  module.exports = { scrapeLinks, downloadLinks };
}



