const JSZip = require("jszip");
const fs = require('fs').promises;
const path = require("path");

async function isFile(fn) {
  return (await fs.lstat(fn)).isFile();
}

async function readDirFiles(pth) {
  let results = [];
  let entries = await fs.readdir(pth);
  for (const e of entries) {
    let fn = path.join(pth, e);
    if (await isFile(fn)) {
      let data = await fs.readFile(fn);
      results.push({ name: e, fullname: fn, data });
    }
  }
  return results;
}

async function zipAllArticles(path=".data") {
  let zip = new JSZip();
  let datafiles = await readDirFiles(path);
  for (const f of datafiles) {
    zip.file(f.name, f.data);
  }
  let zipcontent = await zip.generateAsync({ type: "nodebuffer" });
  //let ofn = path.join(os.tmpdir(),"PA-"+(Math.floor(Math.random() * 2116316160) + 60466176).toString(36)+".zip");
  //fs.writeFile(ofn,zipcontent);
  return zipcontent;
}

async function get(request,response) {
  const fileName = 'pa-scrape-ara.zip';
  const fileType = 'application/zip';
  let zipContents = await zipAllArticles();
  response.writeHead(200, {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': fileType,
      })  
  return response.end(zipContents);  
}

module.exports = { zipAllArticles, get }