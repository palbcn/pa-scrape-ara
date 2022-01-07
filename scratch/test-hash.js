
const fs = require('fs/promises');

/******************************************************************/
// primitive functions for manipulating a array of { hash, value } objects sorted by hash
function findItem(arr,hash) {  // binary search in a sorted array
  let start=0;
  let end=arr.length-1;
  while (start<=end){
    let mid=Math.floor((start + end)/2);
    if (arr[mid].hash===hash) return mid;
    else if (arr[mid].hash < hash) start = mid + 1;
    else end = mid - 1;
  }
  return -start-1;  // to indicate a possible insertion point (-1 for the special 0 case)
}
function getItem(arr,hash) {
  let idx = findItem(arr,hash);
  if (idx>=0) return arr[idx];
  else return null;
}
function setItem(arr,hash,value) {
  let idx = findItem(arr,hash);
  value.hash = hash;
  if (idx>=0) {
    arr[idx]=value;
  } else {
    arr.splice(-idx-1,0,value);
  }
}

/******************************************************************/
async function loadItems(fn) {
  let jsontxt = await fs.readFile(fn,'utf8');
  let items = JSON.parse(jsontxt);
  return items;
}

/******************************************************************/
(async function(){
  let test = await loadItems('tempdata/ara-articles.json');
  /*
  for (let i=0; i<100; i++) {
    let id = Math.random().toString().substr(2, 8);
    let val = Math.random().toString().substr(2, 8);
    test.push({hash:id,value:val});
  }
  */
  test.sort ( (a,b) => parseInt(a.hash) - parseInt(b.hash) );

  test.forEach ( (t,i) => console.log( i, t.hash, t.title )) ;

  console.log(findItem(test,'12345678'));
  setItem(test,'12345678',{ title:'un dos tres cuatro etc'});
  test.forEach ( (t,i) => console.log( i, t.hash, t.title )) ;
  
  await fs.writeFile('tempdata/new.json',JSON.stringify(test),'utf8');
  
  
  /*
  console.log(findItem(test,'12345678'));
  console.log(getItem(test,'12345678'));

  console.log(findItem(test,'00000000'));
  setItem(test,'00000000','000000000000000000000000000000');
  test.forEach ( (t,i) => console.log( i, t.hash, t.value )) ;
  console.log(findItem(test,'00000000'));
  console.log(getItem(test,'00000000'));*/
})();


