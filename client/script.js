(function() {
  function dateToLocaleLongEsString(date) {
    return new Date(date).toLocaleDateString("es", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function renderDates(info) {
    document.getElementById("info-now").textContent = new Date().toLocaleString(
      "es"
    );
    document.getElementById("info-started").textContent = new Date(
      info.started
    ).toLocaleString("es");
    document.getElementById("info-loaded").textContent = new Date(
      info.loaded
    ).toLocaleString("es");
  }

  let articlesSection = document.getElementById("articles");

  function renderArticle(article, index) {
    let newArticle = document.createElement("article");
    if (article.header == article.title) article.header = "";
    let articleHtml = `
    <h1>${article.title}</h1>
    <h3>${article.author}</h3>
    <p>${new Date(article.date).toLocaleString("es")}</p>
    <p><a href="${article.href}">[${article.href}]</a></p>
    <div>${article.content}</div>
  `;
    newArticle.innerHTML = articleHtml;
    articlesSection.appendChild(newArticle);
  }

  function renderArticles(articles) {
    articlesSection.innerHTML = "";
    articles.forEach(renderArticle);
  }

  async function fetchAndRenderArticlesAndInfo() {
    let response = await fetch("/articles");
    if (response.status === 202) {
      setTimeout(fetchAndRenderArticlesAndInfo, 10000); // if not ready, retry in 10 seconds.
      return;
    }

    if (!response.ok)
      throw new Error(
        `Invalid response from fetch. Status: ${response.status}`
      );

    let articles = await response.json();
    renderArticles(articles);

    response = await fetch("/info");
    let info = await response.json();
    info.requested = date;
    renderDates(info);
  }

  fetchAndRenderArticlesAndInfo();

})();
