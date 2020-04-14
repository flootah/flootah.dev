var i = 0;
let words = ["hi", "hello", "bonjour", "heya", "こんにちは"]

function press () {
    console.log(words[i])

    if (i == 4) i = -1
    i++;
}