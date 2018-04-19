

const transitions = [0, 0.968, 1.368, 1.969, 2.903, 3.804, 4.471, 5.005, 6.540];
var change = [1.4, 1.9, 3.3, 3.7, 5.1, 5.6, 7.5,  8.9, 9.4, 10.8, 11.2, 12.6, 13.1, 15.0,  16.4, 16.9, 18.3,  18.7, 20.1, 20.6];
var vid = document.getElementById("wakaba");
var state = 0;
var seek;
vid.muted = true;
vid.loop = true;

var sound = new Howl({
    src: ['src/audio/doublejump.mp3', 'src/audio/doublejump.ogg'],
    loop: true,
    autoplay: true,
    onload: begin,
    onend: nextState,
  } );
var doublejump = sound;

/**
 * loops state from 1-8
 */
function nextState() {
    if(state < 8) {
        state++;
    } else {
        state = 1;
    }
    transition();
    //console.log(state);
};

/**
 * mutes sound
 */
function mutesound() {
    if(sound._muted == true) {
        sound.mute(false);
    } else {
        sound.mute(true);
    }
};

/**
 * pauses video IFF state has not changed since execution.
 * to be used with a setTimeout
 * @param {*} currentstate the current state before setTimeout
 */
function pauseVid(currentstate) {
        if(currentstate == state) vid.pause();
};

function transition() {
switch(state) {
        case 0:
        vid.play();
        setTimeout(function() {
            pauseVid(0);
        }, 600);
        break;
        case 1:
        vid.currentTime = transitions[1];
        vid.play();
        setTimeout(function() {
            pauseVid(1);
        }, 500);
        break;
        case 2:
        vid.currentTime = transitions[2];
        vid.play();
        setTimeout(function() {
            pauseVid(2);
        }, 600);
        break;
        case 3:
        vid.currentTime = transitions[3];
        vid.play();
        setTimeout(function() {
            pauseVid(3);
        }, 600);
        break;
        case 4:
        vid.currentTime = transitions[4];
        vid.play();
        setTimeout(function() {
            pauseVid(4);
        }, 600);
        break;
        case 5:
        vid.currentTime = transitions[5];
        vid.play();
        setTimeout(function() {
            pauseVid(5);
        }, 600);
        break;
        case 6:
        vid.currentTime = transitions[6];
        vid.play();
        setTimeout(function() {
            pauseVid(6);
        }, 600);
        break;
        case 7:
        vid.currentTime = transitions[7];
        vid.play();
        setTimeout(function() {
            pauseVid(7);
        }, 600);
        break; 
        case 8:
        vid.currentTime = transitions[8];
        vid.play();
        setTimeout(function() {
            pauseVid(8);
        }, 1000);
        break;
        default:
        console.log(state);
        console.log('yeah something is def wrong');
        break;
    };

};

function begin() {
    console.log("begin() now running")
    transition();
    statemachine();
};

function statemachine() {
setTimeout(function() {
    seek = parseFloat(sound.seek(doublejump).toFixed(1));
    setInterval(function(){
        seek = parseFloat(sound.seek(doublejump).toFixed(1)); 
        if(change.includes(seek)) {
            nextState();
            console.log("boop!");
        }
    }, 100);
}, 1250);
}

// get infobox
var infobox = document.getElementById("info");

//toggles infobox visibility
function toggleinfo() {
    if(infobox.style.visibility == 'hidden') {
        infobox.style.visibility = 'visible';
    } else {
        infobox.style.visibility = 'hidden'
    };
};

//listens for clicks to toggle infobox.
document.addEventListener("click", toggleinfo);

/* 
 * listens for keydowns
 * M = mute
 * I = info
 */

document.addEventListener("keydown", function(e) {
    if(e.keyCode == 73) {
        toggleinfo();
    };
    if(e.keyCode == 77) {
        mutesound();
    };
});
