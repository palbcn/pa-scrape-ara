/*
 storage to json
 pa bcn
*/

const fs = require('fs/promises');
const {LocalStorage} = require("node-localstorage");

let localStorage = new LocalStorage('../.data'); 

function dmy(ms) {
  const leading0 = n => ((n<10)?"0":"")+n;
  var d = new Date(ms);
  return leading0(d.getDate())       +'/'+
         leading0(d.getMonth()+1)   +'/'+
         d.getFullYear();
}

function getAllArticles() {
  let all = [];
  let nkeys = localStorage.length;
  for (let i=0; i<nkeys; i++) {
    let hash = localStorage.key(i);
    let item = localStorage.getItem(hash);
    let article = JSON.parse(item);
    all.push(article);
  }
  return all;
}

(async function(){  
  let all = getAllArticles();
  let alljson = JSON.stringify(all);
  await fs.writeFile('../.data/ara-articles.json',alljson,'utf8');
  console.log('../.data/ara-articles.json');
  //all.forEach ( a  => console.log(a.hash,dmy(a.date),a.title,"-",a.author));
  
})();
