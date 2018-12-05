//holds first page, default is one. obviously.
var curPage = 1;

//clicking each button will cause changePage() to be triggered.
document.getElementById("button1").onclick = function() { changePage(1); };
document.getElementById("button2").onclick = function() { changePage(2); };
document.getElementById("button3").onclick = function() { changePage(3); };

//initialize first page
document.getElementById("button" + curPage).style.backgroundColor="#777777";
document.getElementById("main" + curPage).style.display="flex";

//function to change pages and highligh/de-light buttons
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