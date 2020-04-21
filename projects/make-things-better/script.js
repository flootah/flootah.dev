console.log("heya")
var i = 0;
var presses = 0;
var words = ["copy wur", "i read u", "are you well?", "things /should/ be made better", "message repeats."]
function press() {
    console.log(words[i])
    if (i == words.length-1) i = -1
    i++
    if(presses == 10) {
        alert("it wont get better.")
        return
    }
    presses++
}