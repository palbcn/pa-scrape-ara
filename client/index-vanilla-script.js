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
  
  function renderArticleContent(content){
    let lines = content.split(/\r?\n/);
    //lines = lines.slice(4);
    lines = lines.map( line => `<p>${line}</p>`);
    return lines.join('\n');
  }
  
  function renderTitle(title){
    if (title.startsWith("Opinió")) title=title.slice(7);
    return `<h1>${title}</h1>`;    
  }

  function renderArticle(article, index) {
    let newArticle = document.createElement("article");
    if (article.header == article.title) article.header = "";
    let articleHtml = `
    ${renderTitle(article.title)}
    <h3>${article.author}</h3>
    <p>${new Date(article.date).toLocaleString("es")}</p>
    <p><a href="${article.href}">[${article.href}]</a></p>
    <div>${renderArticleContent(article.content)}</div>
  `;
    newArticle.innerHTML = articleHtml;
    articlesSection.appendChild(newArticle);
  }

  function renderArticles(articles) {
    articles.sort( (a,b) => b.date - a.date );
    articlesSection.innerHTML = "";
    articles.forEach(renderArticle);
  }
  
  async function fetchAndRenderInfo() {
    let response = await fetch("/info");
    let info = await response.json();
    info.requested = Date.now();
    renderDates(info);
  }

  async function fetchAndRenderArticles() {
    let response = await fetch("/articles");
    if (response.status === 202) {
      setTimeout(fetchAndRenderArticles, 10000); // if not ready, retry in 10 seconds.
      return;
    }
    if (!response.ok)
      throw new Error(
        `Invalid response from fetch. Status: ${response.status}`
      );

    let articles = await response.json();
    renderArticles(articles);
  }
  async function fetchAndRenderArticlesAndInfo() {
    fetchAndRenderArticles();
    fetchAndRenderInfo();
  }

  fetchAndRenderArticlesAndInfo();

})();
