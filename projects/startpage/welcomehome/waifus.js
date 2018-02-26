var image = document.getElementById("waifupic");    //defines image div
image.onclick = function() { changeWaifu() };       //changes waifu onClick

/**
 * list of waifus that will show on the sidebar.
 * each waifu's name and image filename must be manually listed here.
 * both lists are respective to each other, so:
 * the first 'name' corresponds to the first 'file', the second corresponds to the second, 3rd to the 3rd, etc...
 * 
 * Typically:
 * name is in format 'first last'    (it can really just be any string)
 * file is in format 'firstlast.jpg' (it can really be any name or image type)
 * 
 * ensure that all entries are followed by a comma ( , ). The last entry need not include it.
 */
var Waifus = {
    name:[
        "asuka langely",
        "rei ayanami",      
        "akko kagari",
        "lotte yansson",
        "tsumugi kotobuki",
        "izumi sakurai",
        "chito and yuuri"
    ],

    file:[
        "asukalangely.jpg",
        "reiayanami.png",
        "akkokagari.jpg",
        "lotteyansson.jpg",
        "tsumugikotobuki.png",
        "izumisakurai.png",
        "chitoyuuri.png"
    ],

    numWaifus:undefined,    //number of waifus detected
    curWaifu:undefined,     //index of currently visible waifu
};

/**
 * checks if the number of entries in both lists agree.
 * if not, an error is thrown, putting up a window alert.
 * if so, numWaifus is set.
 */
try{ 
    if(Waifus.file.length != Waifus.name.length) {
        throw WaifuMismatchError;
    } else {
        Waifus.numWaifus = Waifus.name.length;
    }
}
catch(WaifuMismatchError) {
    window.alert("Error in waifus.js! Amount of listed names and files do not agree.") 
}

/**
 * randomly selects a waifu that is not the current one, 
 * then changes the image and name divs respectively.
 */
function changeWaifu() {
    Waifus.curWaifu++;
    if(Waifus.curWaifu >= Waifus.numWaifus) {
        Waifus.curWaifu = 0;
    }
    document.getElementById("waifuname").innerHTML = Waifus.name[Waifus.curWaifu];  //set name
    image.style.backgroundImage = "url(src/" + Waifus.file[Waifus.curWaifu] + ")";  //set image
}

Waifus.curWaifu = Math.floor(Math.random() * Waifus.numWaifus);                            //initialize first waifu, randomly.
changeWaifu();