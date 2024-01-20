function titleClick(e) { 
  // toggle visibility to the article div for this h1  
  let title = e.target;
  let article = title.parentElement;
  let content =article.getElementsByTagName("div")[0];
  content.addEventListener("click",contentClick);
  let display = content.style.display || 'none';
  content.style.display = (display=='none') ? 'block' : 'none';
}

function contentClick(e) {
  // toggle visibility to the article div for this h1  
  let content = e.target.parentElement;
  content.style.display = 'none';
}

function copyButtonClick(e) {
  let button = e.target
  let article = button.parentElement;
  button.textContent ='';
  let text = article.innerText;
  navigator.clipboard.writeText(text);
  button.textContent ='Copy';
        
}

function addOnclickToArticle(article) {
  // add titleClick to each article h1
  console.log("add click",article);
  let h1 = article.getElementsByTagName("h1")[0];
  h1.addEventListener("click",titleClick);
}

function addOnclickToButton(article) {
  // add titleClick to each article h1
  let button = article.getElementsByTagName("button")[0];
  console.log("add click",button);
  button.addEventListener("click",copyButtonClick);
}

// invoke addOnclick every time new article is loaded to DOM
htmx.onLoad(function(target) {
  console.log("htmx:load",target);
  if (target.tagName=="ARTICLE") {
    addOnclickToArticle(target);
    addOnclickToButton(target);
  }
  
});