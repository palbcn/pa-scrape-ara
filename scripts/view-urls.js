const fs = require("fs/promises");
const os = require("os");
const path = require('path');

const ROOT = "https://ara.cat/opinio";

const ARTICLES_JSON_FN = './data/ara-articles.json';
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

/*---------------------------------------------*/
let allArticles = [];
let modifiedArticles = false;

async function readArticles() {
  try {
    let jsontxt = await fs.readFile(ARTICLES_JSON_FN, 'utf8');
    let articles = JSON.parse(jsontxt);
    if (!Array.isArray(articles)) return [];
    articles.sort((a, b) => parseInt(a.hash, 16) - parseInt(b.hash, 16));
    return articles;
  } catch (err) {
    console.error(err);
    return [];
  }
}
async function writeArticles(articles) {
  try {
    let jsontxt = JSON.stringify(articles);
    await fs.writeFile(ARTICLES_JSON_FN, jsontxt, 'utf8');
    modifiedArticles = false;
  } catch (err) {
    console.error(err);
  }
}

function findArticle(hash) {  // binary search in a sorted array
  let start = 0;
  let end = allArticles.length - 1;
  while (start <= end) {
    let mid = Math.floor((start + end) / 2);
    if (allArticles[mid].hash === hash) return mid;
    else if (allArticles[mid].hash < hash) start = mid + 1;
    else end = mid - 1;
  }
  return -start - 1;  // to indicate a possible insertion point (-1 for the special 0 case)
}
function getArticle(hash) {
  let idx = findArticle(hash);
  if (idx >= 0) return allArticles[idx];
  else return null;
}
function setArticle(hash, article) {
  let idx = findArticle(hash);
  article.hash = hash;
  modifiedArticles = true;
  if (idx >= 0) {
    allArticles[idx] = article;
  } else {
    allArticles.splice(-idx - 1, 0, article);
  }
}


(async function main() {
  allArticles = await readArticles();
  modifiedArticles = false;
  let links = allArticles.map(a => ({ hash: a.hash, href: a.href }))
  await fs.writeFile(path.join(os.tmpdir(), "ara-links.json"), JSON.stringify(links, null, 2), "utf8");

  let urls = allArticles.reduce((a, e, i) => {
    let url = new URL(e.href);
    let pth = path.dirname(url.pathname);
    // a contains url, increment count
    let index = a.findIndex(e => e.path == pth);
    if (index != -1) {
      a[index].count++;
      a[index].all.push(url);
    } else {
      a.push({ path: pth, count: 1, all: [url] });
    }
    return a;
  }, []);
  urls.sort((a, b) => b.count - a.count);

  await fs.writeFile(path.join(os.tmpdir(), "ara-urls.json"), JSON.stringify(urls, null, 2), "utf8");

})()

