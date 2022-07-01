function opendoor() {
    var door = document.getElementById("door")
    door.classList.toggle("open");
    setTimeout(() => {window.open("homestem", "_self")}, 1000)
    door.onclick = null;
}
