console.log("heya")
var i = 0;
let words = ["copy wur", "i read u", "are you well?", "things /should/ be made better", "message repeats."]
function press() {
    console.log(words[i])
    if (i == words.length-1) i = -1
    i++;
}