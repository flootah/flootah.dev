/**
 * new gameplan:
 * notes are now objects. containing content and timestamp(which can now be stored up to the second).
 * the note objects will be stored in a notes[] array. this array is then serialied and stored into the cookie 'notes'
 * when the page loads, we get and unserialize the 'notes' cookie and then print each note simply by looping through the array.
 * 
 * i think thats much better. i dont know if JSON need a library tho im worried about that.
 * note editing becomes very easy though, just access its array and change its content.
 */

//creation of notes array.
if(getCookie("notes") != null) {
    notes = JSON.parse(getCookie("notes"));
} else {
    var notes = [];
}

/**
 * Contructor for Note object.
 * @param {content of note} content 
 * @param {timestamp of note creation} timestamp 
 */
function Note(content, timestamp) {
        this.content = content;
        this.timestamp = timestamp;
        this.edited = false;
        this.editdate = null;
}

function toggleForm() {
    var form = document.getElementById("formwrapper");
    var newnote = document.getElementById("newnote");
    var display = form.style.display;

    if (display == "none") {
        form.style.display = "inline-block";                //make box visible
        newnote.innerHTML = "cancel";                    //empty newnote span
    } else {
        form.style.display = "none";                        //hide box
        newnote.innerHTML = "new note...";                  //show newnote span
    }
    document.getElementById("notetaker").value = "";
}
/**
 * Function to create a new note from content of 'notetaker' textbox.
 * Will not create a new note without content.
 */
function newNote() { 
    var textbox = document.getElementById("notetaker");                 //get textbox           
    var time = montharray[month]+" "+daym+", " +year+" "+ checkHour(h)+":"+m+ampm;  //gets time
    if(textbox.value == "") {
        toggleForm();
        return;
    }

    notes.push(new Note(textbox.value, time));                          //pushes a new note object to notes array
    printNotes();                                                       //prints Notes to save
    textbox.value = "";
    autoGrow(textbox);
    toggleForm();
}

/**
 * deletes a note from notes[] at specified index
 * @param {index of note to be deleted} index 
 */
function deleteNote(index) {
    if(confirm("delete this note?")) {
        notes.splice(index, 1);
        printNotes();
    }
}

/**
 * so... when edit is clicked, we do a few things...
 * -replace p in note div with an input element that contains the previous note.
 * -enter to submit?
 * -when this input submits, call another fuction to set that note's edited and editdate values
 * -change the edit and del to submit... and cancel
 *      -probs do this thru either changing the spans ore hiding the element and making a new one
 * -this will replace the editdel thingy?
 * -also onkeyup(resizer)
 * 
 * @param {index of note to be edited} index 
 * @param {content of note before edit} content 
 */
function editPrompt(index) {
    //creation of elements and getting note element
    var noteDiv = document.getElementById("note" + index);            //note div
    var noteContent = document.getElementById("content" + index);     // note's context paragraph
    var noteTimestamp = document.getElementById("timestamp" + index);           //note's timestamp
    var editInput = document.createElement("textarea");                         // new input element
    var saveEdit = document.createElement("div");                               // new savecancel div, like editdel.
    var save = document.createElement("span");                                  // new save span
    var cancel = document.createElement("span");                                // new cancel span

    //adding attributes to new elements
    editInput.setAttribute("class", "content");
    editInput.setAttribute("id", "editInput" + index);
    editInput.setAttribute("onkeyup", "autoGrow(this)");
    editInput.innerHTML = noteContent.innerHTML;
    editInput.style.height = noteContent.clientHeight+3 + "px";
    saveEdit.setAttribute("class", "savecancel");
    saveEdit.setAttribute("id", "savecancel" + index);
    save.setAttribute("class", "save");
    cancel.setAttribute("class", "cancel");
    cancel.setAttribute("onclick", "printNotes()");
    save.setAttribute("onclick", "editNote(" + index + ")");
    //hide note elements
    document.getElementById("content" + index).style.display = "none";
    document.getElementById("editdel" + index).style.display = "none";
    //combine elements and replace
    saveEdit.appendChild(save);
    saveEdit.appendChild(cancel);
    noteDiv.insertBefore(editInput, noteTimestamp);
    noteDiv.insertBefore(saveEdit, noteTimestamp);
    editInput.focus();
}

function editNote(index) {
    var curNote = notes[index]
    //set note from notes[index] to the value of the edit textbox
    curNote.content = document.getElementById("editInput" + index).value;   //edit content
    curNote.edited = true;                                                  //set edited to true
    var time = montharray[month]+" "+daym+" "+ checkHour(h)+":"+m+ampm;     
    curNote.editdate = time;                                                //set edited time
    
    printNotes();
}

 /**
  * loads document cookie and prints saved notes.
  */
function printNotes() {
    clearNotes();
    for(var i = 0; i < notes.length; i++) {
        var curNote = notes[i];
        //variables for note context and timestamp
        var content = curNote.content;
        var timestamp = curNote.timestamp;
        //create note spans and paragraphs, indentify 'notes' div
        var notespan = document.createElement('div');//single note container
        var dashspan = document.createElement('div');//dash before note
        var contentP = document.createElement('p');//note contents
        var timestampP = document.createElement('p');//timestamp
        var editdel = document.createElement('div');//edit/del buttons
        var notesdiv = document.getElementById("notes");//select container for all notes
        var newnote = document.getElementsByClassName("notecreation")[0];//select newnote div
        //give classes and id's to each
        //class:    [note, content, timestamp]...
        //id:       [note+i, content+i, timestamp+i]...
        notespan.setAttribute("class", "note");
        notespan.setAttribute("id", "note" + i);
        dashspan.setAttribute("class", "bullet");
        dashspan.setAttribute("id", "dash" + i);
        contentP.setAttribute("class", "content");
        contentP.setAttribute("id", "content" + i);
        timestampP.setAttribute("class", "timestamp");
        timestampP.setAttribute("id", "timestamp" + i);
        editdel.setAttribute("class", "editdel");
        editdel.setAttribute("id", "editdel" + i);
        //prepend 'note' span to 'notes' div, append 'content' and 'timestamp' paragraphs to 'note' span.
        newnote.parentElement.insertBefore(notespan, newnote.nextSibling);
        notespan.appendChild(dashspan);
        notespan.appendChild(contentP);
        notespan.appendChild(editdel);
        notespan.appendChild(timestampP);
        //set content and timestamp
        contentP.innerHTML = content;
        timestampP.innerHTML = timestamp;
        // if note is edited, put a * after timestamp, and make a highlight that lets you know it was edited.
        if(notes[i].edited) {
            timestampP.innerHTML = timestamp + "*";
            timestampP.setAttribute("title", "edited " + curNote.editdate);
        }
        //set buttons to editdel
        var del = document.createElement('span');
        var edit = document.createElement("span");
        del.setAttribute("class", "del");
        edit.setAttribute("class", "edit");
        del.setAttribute("onclick", "deleteNote(" + i + ")");
        edit.setAttribute("onclick", "editPrompt(" + i + ")");
        editdel.appendChild(edit);
        editdel.appendChild(del);
    }//end for
}//end printNotes()

    /**
     * clears notespace for fresh printing.
     */
function clearNotes() {
        var notesdiv = document.getElementById("notes");        
        var rmnotes = document.getElementsByClassName("note");  
        var  numNotes = rmnotes.length;                         
        for(i = 0; i < numNotes ; i++) {                        
            notesdiv.removeChild(rmnotes[0]);
        }
    //save notes to cookie
    setCookie("notes", JSON.stringify(notes))
}

/**
 * gets cookie value by name
 * @param {name of cookie to be retrieved} name 
 */
function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
    return null;
  }
/**
 * @author Moussawi7 https://stackoverflow.com/questions/17772260/textarea-auto-height
 * function to auto-grow textarea to one's desires. or to the text's used space. whichever comes first.
 * 
 * @param {element to grow} element 
 */
  function autoGrow(element) {
    setTimeout(function(){
    element.style.height = 0;
    element.style.height = (element.scrollHeight)+"px";
    }, 10);
}

/**
 * creates an expiry date for the cookie. set to 10 years from load time.
 */

function setCookie(key, value) {
    var d = new Date();
    d.setTime(d.getTime() + (10*365*24*60*60*1000));

    var expires =   "expires=" + d.toUTCString() + ";";

    document.cookie = key + "=" + value + ";" + expires + "path=/;";
}

printNotes();