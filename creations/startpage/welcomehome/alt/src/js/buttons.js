//holds current page, default is the first page. obviously.
var curPage = 1;

//clicking each button will cause changePage() to be triggered with the respective page number passed.
document.getElementById("button1").onclick = function() { changePage(1); };
document.getElementById("button2").onclick = function() { changePage(2); };
document.getElementById("button3").onclick = function() { changePage(3); };

//initialize first page
document.getElementById("button" + curPage).style.backgroundColor="#777777";
document.getElementById("main" + curPage).style.display="flex";

//function to change pages and highligh/de-light buttons
//nextPage: the page which we are changing to.
function changePage(nextPage) {
    if (nextPage == curPage) {
        return;
    }
    document.getElementById("main" + curPage).style.display="none";
    document.getElementById("button" + curPage).style.backgroundColor="#FFFFFF";
    document.getElementById("main" + nextPage).style.display="flex";
    document.getElementById("button" + nextPage).style.backgroundColor="#777777";
    curPage = nextPage;
}