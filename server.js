const express = require("express");
const fs = require("fs");
const path = require("path");
const scraper = require("./scraper");

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

/* -------------------- server routes ------ */
let app = express();
app.use(express.static("client"));

app.get("/articles", (request, response) => {
  if (articles.length === 0) {
    return response
      .status(202)
      .send("Request Accepted but data not ready yet. Retry later");
  }
  response.send(articles);
});

app.get("/info", (request, response) => {
  response.send({ started, loaded });
});

const listener = app.listen(process.env.PORT || 48447 , () => {
  console.log(
    `PA-aracat-scraper server is open for e-business on port ${listener.address().port
    }`
  );
});
