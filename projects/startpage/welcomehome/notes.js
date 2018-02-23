/**
 * gameplan:
 * cookies store notes in a format of note0 = "content" and timestamp0="timestamp";
 * divs are created and made using these.
 * 
 * website loads
 * cookies load and place
 * anytime a new note is made, edited, or deleted, cookies is updated.
 * okay thats it i think.
 * note editing can come later.
 */

 /**
  * loads document cookie and prints saved notes.
  */
function printNotes() {
    var cookie = document.cookie;
    var ca = document.cookie.split(";");

    for(var i = 0; i < ca.length; i = i+2) {
        //variables for note context and timestamp
        var content = ca[i].substring(indexOf("=")+1);
        var timestamp = ca[i+1].substring(indexOf("=")+1);;
        //create note spans and paragraphs
        var notespan = document.createElement('span');
        var contentp = document.createElement('p');
        var timestampp = document.createElement('p');
        //give classes and id's to each
        //class:    [note, content, timestamp]
        //id:       [note+i, content+i, timestamp+i]
        notespan.setAttribute("class", "note");
        notespan.setAttribute("id", "note" + i);
        contentp.setAttribute("class", "content");
        contentp.setAttribute("id", "content" + i);
        timestampp.setAttribute("class", "timestamp");
        timestampp.setAttribute("id", "timestamp" + i);
        //append 'note' to 'notes', append content and timestamp to 'note'.
        document.getElementsByClassName("notes").appendChild(notespan);
        notespan.appendChild(contentp);
        notespan.appendChild(timestampp);
        //set content and timestamp
        contentp.innerHTML = content;
        timestampp.innerHTML = timestamp;
    }
}

function newNote() {
    var input = document.getElementById("notetaker").value;
    if(input == "") return;
    var time = montharray[month]+" "+daym+" "+checkHour(h)+":"+m+ampm;

    document.cookie = "username=johndoe"
    document.cookie = "content="+input;
    document.cookie = "timestamp="+time;
    printNotes();
}

function deleteNote(index) {
    var cookie = document.cookie;
    var ca = document.cookie.split(";");

    ca.splice(index*2, 2);
    ca.join(";");
    document.cookie = ca;
}

var form = document.getElementById("newnote");

//"new note..." button
var newbutton = document.createElement('span');
newbutton.setAttribute("class", "notebutton");
newbutton.innerHTML = "new note...";
var notes = document.getElementById("notes");
notes.appendChild(newbutton)

