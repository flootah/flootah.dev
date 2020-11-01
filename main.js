
function menu() {
    document.getElementById("burgercontainer").classList.toggle("change");
    document.getElementById("sidebar").classList.toggle("open");
}

function menuOff() {
    document.getElementById("burgercontainer").classList.remove("change");
    document.getElementById("sidebar").classList.remove("open");
}