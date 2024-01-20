function paginate(array, pageNumber = 0, pageSize = 20,) {
  return array.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);
}  

let a = [...Array(997).keys()];
console.log( paginate (a) );
console.log(paginate(a,2));
console.log(paginate(a,0,10));
console.log(paginate(a, 49, 21));