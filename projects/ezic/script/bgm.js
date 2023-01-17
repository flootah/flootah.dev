Howler.volume(0.2)

var bgm = new Howl({
    src: ['../src/bgm000.mp3'],
    loop: true,
    buffer: true,
});

bgm.play();

function chVolume(value) {
    Howler.volume(value);
  }

function chRate(value) {
    bgm.rate(value);
}

function chSource(source) {
    bgm.unload();
    bgm = new Howl({
        src: ["../src/" + source],
        loop: true,
        buffer: true,
        html5: true
    });
    bgm.play();
}