var navHighlight;
var curHighlight = -1;
var navbar;
var bubbles;

window.onload = function() {
    navbar = document.querySelector("#bubblecontainer");
    bubbles = navbar.children;
    navAnimate();
    window.addEventListener("scroll", navAnimate , false);
}

function navAnimate () {
    switch(true) {
        case (this.scrollY <= 100):
            navHighlight = 0;
            break;
        case (this.scrollY <= 500):
            navHighlight = 1;
            break;
        case (this.scrollY >= 500):
            navHighlight = 2;
            break;
        default:
            console.log("uhhh..")
            break;
        }

    if(curHighlight != navHighlight) {
        if(curHighlight != -1) bubbles[curHighlight].style.backgroundColor = "inherit";
        bubbles[navHighlight].style.backgroundColor = "red";
        curHighlight = navHighlight;
    }
  }
  
