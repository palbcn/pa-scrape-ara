/*
 scrape a single ara.cat/opinio article
 pa bcn
*/
const request = require("superagent");
const cheerio = require("cheerio");

/******************************************************************/
// https://en.wikipedia.org/wiki/Jenkins_hash_function
function jenkinsHash(str) {
  let a = 0;
  for (let i = 0; i < str.length; i++) {
    a += str.charCodeAt(i);
    a += a << 10; a ^= a >> 6;
  }
  a += a << 3; a ^= a >> 11;
  a += (a << 15) & 4294967295;
  return a >>> 0;
}
function hash(str) {
  return jenkinsHash(str).toString(16).padStart(8, '0');
}
function hashToInt(str) {
  return parseInt(str, 16);
}

/******************************************************************/
async function readPage(url) {
  try {
    let res = await request(url);
    return res.text;
  } catch (err) {
    console.error('readPage', err);
    return '';
  }
}

/******************************************************************/
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
  try {
    let res = await request(url);
    let html = res.text;
    let $ = cheerio.load(html);
    
    let title = extractSelectorText($,".ara-opening-info h1.title");
    let content = extractSelectorText($, ".ara-body p");
    let author = $(".opinion-authors a.name").text().trim();
    let date = $(".ara-opening-info span.date").text().trim();
    let hsh = hash(url);
    if (TESTDATE.test(date)) {
      let ddmmyyyy = date.split("/");
      let newdate = new Date(ddmmyyyy[2], ddmmyyyy[1] - 1, ddmmyyyy[0]);
      date = newdate.getTime();
    } else {
      date = Date.now();
    }
    return { title, author, date, content, hash: hsh };
  } catch (err) {
    console.error('scrapeArticle', url, err);
    return { err };
  }
}


/******************************************************************/
(async function main() {
  let article = await scrapeArticle(process.argv[2] || "https://llegim.ara.cat/opinio/l-otan-chanel-rigoberta-bandini_129_4257501.html");
  console.log(article);
})();

