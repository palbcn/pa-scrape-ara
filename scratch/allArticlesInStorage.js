/*
 storage ara.cat/opinio
 pa bcn
*/

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
    all.push({index:i,...article});
  }
  all.sort ( (a,b) => a.date - b.date )
  return all;
}

let all = getAllArticles();
all.forEach ( a  => console.log(a.hash,dmy(a.date),a.title,"-",a.author));