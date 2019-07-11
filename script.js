var rows=4;
var cols=4;
function createDiv(){
var x = document.createElement("DIV");
var t = document.createTextNode("This is a div element.");
x.setAttribute("style", "border: 2px solid white; margin: 10px; width: 20em; height:20em; ");
x.appendChild(t);
document.getElementById('content').appendChild(x);

alert('Hi');
}

