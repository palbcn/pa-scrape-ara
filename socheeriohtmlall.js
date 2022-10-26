const cheerio = require("cheerio");

let $=cheerio.load(`<ul id="fruits">
  <li class="apple">Apple</li>
  <li class="plum">Plum</li>
  <li class="apple">Apple TOoo</li>
  <li class="pear">Pear</li>
</ul>`);

function t(s) {
  console.log(s);
}

t($('.apple').html());

t($('.apple').map( (i,el) => $(el).html()).get().join("\n"));


