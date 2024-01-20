const express = require("express");
const fs = require("fs");
const path = require("path");
const scraper = require("./scraper");
const archiver = require("./archiver");

/* -------------------- util functions ------ */
function zeroPad(num, places) {
  return String(num).padStart(places, "0");
}
function yyyymmdd(date) {
  return (
    "" +
    date.getFullYear() +
    "-" +
    zeroPad(date.getMonth() + 1, 2) +
    "-" +
    zeroPad(date.getDate(), 2)
  );
}

/* -------------------- server global data ---- */
let articles = [];
let started = Date.now();
let loaded = 0;

/* -------------------- obtain articles ------- */
(async function(){
  articles = await scraper();
  loaded = Date.now();
})();

/* -------------------- html helpers ------- */
function articleContentToHtml(content) {
  let lines = content.split(/\r?\n/);
  //lines = lines.slice(4);
  lines = lines.map(line => `<p>${line}</p>`);
  return lines.join('\n');
}

function titleToHtml(title) {
  if (title.startsWith("Opinió")) title = title.slice(7);
  return `<h1>${title}</h1>`;
}

function pageToHtml(articles, pagenum) {
  let articleshtml = articles.map(function articleToHtml(article, index, { length }) {
    let islast = (index + 1 === length);
    let lastElementHtmx = `hx-get="/articles/?page=${pagenum + 1}" hx-trigger="revealed" hx-swap="afterend"`; // the htmx magic for lazy loading 
    if (article.header == article.title) article.header = "";
    let articleHtml = `<article id="article-${pagenum + "-" + index}" ${islast ? lastElementHtmx : ""}>
    ${titleToHtml(article.title)}
    <button id="copy-${article.hash}">Copy</button>
    <h3>${article.author}</h3>
    <p>${new Date(article.date).toLocaleString("es")}</p>
    <p><a href="${article.href}">[${article.href}]</a></p>
    <div>${articleContentToHtml(article.content)}</div>
    </article>
  `;
    return articleHtml;
  });
  return articleshtml;
}


/* -------------------- server routes ------ */
let app = express();
app.use(express.static("client"));

app.get("/articles", (request, response) => {
  if (articles.length === 0) {
    return response
      .status(202)
      .send("Request accepted but data not ready yet. Retry later.");
  }
  articles.sort((a, b) => b.date - a.date);

  if (request.header("accept").includes("application/json")) {
    response.send(articles);

  } else {    // return html in pages with htmx pagination
    let pagenum = Number(request.query.page ?? 0);
    function paginate(array, pageNumber = 0, pageSize = 20) {
      return array.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);
    }
    let page = paginate(articles, pagenum);
    let articleshtml = pageToHtml(page, pagenum).join('\n'); // prepare a new paginated bunch of articles
    let oob = `<span id="info-now" hx-swap-oob="true">${new Date().toLocaleString('en-GB')}</span>\n`; // and an out of band swap the time indicator
    response.send(oob + articleshtml);
  }
});

app.get("/info", (request, response) => {
  if (request.header("accept").includes("application/json")) {
    response.send({ started, loaded });
  } else {
    let infohtml = // the span with id become targets for out of band swaps 
      `Service started <span id="info-started">${new Date(started).toLocaleString('en-GB')}</span><br />
Articles loaded <span id="info-loaded">${new Date(loaded).toLocaleString('en-GB')}</span><br />
Page rendered <span id="info-now">${new Date().toLocaleString('en-GB')}</span>`;
    response.send(infohtml);
  }
});

app.get("/archive", archiver.get);


const listener = app.listen(process.env.PORT || 48447 , () => {
  console.log(
    `PA-aracat-scraper server is open for e-business on port ${listener.address().port
    }`
  );
});
