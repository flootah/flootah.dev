
//list of all waifus, corresponding images must be named firstlast.ext\
var names = [
    "asuka langely",
    "rei ayanami",
    "akko kagari",
    "lotte yansson",
    "tsumugi kotobuki",   
];

var files = [
    "asukalangely.jpg",
    "reiayanami.jpg",
    "akkokagari.jpg",
    "lotteyansson.jpg",
    "tsumugikotobuki.png",   
];

var image = document.getElementById("waifupic");
var curWaifu = 0;
changeWaifu();
image.onclick = function() { changeWaifu() };

function changeWaifu() {
    var rand = Math.floor(Math.random() * names.length);
    while(curWaifu == rand) { //ensure next waifu isnt the same as current.
    rand = Math.floor(Math.random() * names.length);
    }
    curWaifu = rand;
    document.getElementById("waifuname").innerHTML = names[curWaifu];
    image.style.backgroundImage = "url(src/" + files[curWaifu] + ")";
}