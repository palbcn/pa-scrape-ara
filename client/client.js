function titleClick(e) {
  // toggle visibility to the article div for this h1  
  let title = e.target;
  let article = title.parentElement;
  let content = article.getElementsByTagName("div")[0];
  let display = content.style.display || 'none';
  content.style.display = (display == 'none') ? 'block' : 'none';
}

function addOnclickToArticle(article) {
  // add titleClick to each article h1
  console.log("add click", article);
  let h1 = article.getElementsByTagName("h1")[0];
  h1.addEventListener("click", titleClick);
}

// invoke addOnclick every time new article is loaded to DOM
htmx.onLoad(function (target) {
  console.log("htmx:load", target);
  if (target.tagName == "ARTICLE") addOnclickToArticle(target);
});