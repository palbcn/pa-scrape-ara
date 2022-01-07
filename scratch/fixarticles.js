/*
 storage ara.cat/opinio
 pa bcn
*/

const {LocalStorage} = require("node-localstorage");
let localStorage = new LocalStorage('./.data'); 
const TESTDATE = /\d+\/\d+\/\d{4}/;

let nkeys = localStorage.length;
console.log(nkeys);

/* fix1 
let lines = article.content.split('\n');
  article.title = article.text;
  delete article.text;
  let date = lines[2];
  let author = lines[1];
  if (TESTDATE.test(date)) {
    article.author = author;
    article.date = date;
  }
  //article.content = article.article;
  //delete article.article;
  */
  
/* fix2   //article.content = article.article;
  //delete article.article;*/
  
  
  
/* fix3
  let date = lines[2];
  if (TESTDATE.test(date)) {
    let ddmmyyyy = date.split("/")
    let newdate = new Date(ddmmyyyy[2], ddmmyyyy[1] - 1, ddmmyyyy[0])
    article.date = newdate.getTime();
    console.log(date,'=>',article.date,"~",dmy(article.date));
  } else {
    article.author = "";
    article.date = Date.now();
  }
  */
function dmy(ms) {
  const leading0 = n => ((n<10)?"0":"")+n;
  var d = new Date(ms);
  return leading0(d.getDate())       +'/'+
         leading0(d.getMonth()+1)   +'/'+
         d.getFullYear();
}

for (let i=0; i<nkeys; i++) {
  let hash = localStorage.key(i);
  let item = localStorage.getItem(hash);
  let article = JSON.parse(item);   
  /* Fix article HERE */
  localStorage.setItem(article.hash,JSON.stringify(article));
  console.log(i,hash,dmy(article.date),article.title,article.author);
}

