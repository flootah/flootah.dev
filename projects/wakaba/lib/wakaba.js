//TODO sometimes things dont line up, and the shit activates twice.

//
const transitions = [0, 0.968, 1.368, 1.969, 2.903, 3.804, 4.471, 5.005, 6.540];
//points of seek in which the video should change in state.
var change = [0, 1.4, 1.9, 3.3, 3.7, 5.1, 5.6, 7.5,  8.9, 9.4, 10.8, 11.2, 12.6, 13.1, 15.0,  16.4, 16.9, 18.3,  18.7, 20.1, 20.6];
//video element
var vid = document.getElementById("wakaba");
//current video state
var state = 0;
//how far in the music is.
var seek;
//set video to be muted and to loop.
vid.muted = true;
vid.loop = true;
//not sure what's going on here... but I know both of these variable have to exist. I wont mess with this yet.
var sound = new Howl({
    src: ['src/audio/doublejump.mp3', 'src/audio/doublejump.ogg'],
    loop: true,
    autoplay: false,
    volume: 0.3,
    onload: begin,
  } );
var doublejump = sound;
//true if currently transitioning, false otherwise.
var trans = false;
/**
 * increments state from 1-8, looping, and logs it.
 */
function nextState() {
    if(state < 8) {
        state++;
    } else {
        state = 1;
    }
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

/**
 * makes the video transition to the next shot.
 * 
 * based on value of state, it will:
 * -seek the video to a predefined point, based on state.
 * -play the video.
 * -after 600ms (500 in one case) it pauses the video.
 * 
 */
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
``
/**
 * the "main" function of the wakaba engine.
 * starts the sound
 * runs changeState (0 --> 1)
 * begins statemachine()
 */
function begin() {
    console.log("begin() now running")
    vid.style.visibility = "visible";
    document.getElementById("loading").style.visibility = "hidden";
    sound.play();
    transition();
    statemachine();
};

/**
 * after 1.25s, set value of seek, then start a .1s interval function.
 * this interval function will:
 * set the value of seek,
 * compare with with any values within change,
 * if there is a match, change state, transition, and log boop! (200ms cooldown)
 */
function statemachine() {
    setTimeout(function() {
        seek = parseFloat(sound.seek(doublejump).toFixed(1));
        setInterval(function(){
            seek = parseFloat(sound.seek(doublejump).toFixed(1)); 
            if(change.includes(seek) && trans == false) {
                trans = true;
                nextState();
                transition();
                //console.log("boop!");
                setTimeout(function(){trans= false},200)
            }
        }, 50);
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
