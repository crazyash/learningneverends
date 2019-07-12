var rows=2;
var cols=2;
var pages = ["http://ic.learningneverends.in", "http://ic.learningneverends.in"];

function createDiv(){
	
	var divTag = document.createElement("DIV");
	var image = createImage();
	var link = createLink();
	divTag.setAttribute("style", "border: 2px solid white; margin: 10px; width: 250px; height:250px; ");
	link.appendChild(image);
	divTag.appendChild(link);
	document.getElementById('content').appendChild(divTag);


}


function createImage(){
	  var x = document.createElement("IMG");
	  x.setAttribute("src", "C:\\Users\\abd1nti\\Pictures\\INR.jpg");
	  x.setAttribute("width", "250px");
	  x.setAttribute("height", "250px");
	  x.setAttribute("alt", "Image");
	  return x;
}

function createLink(){
	 var x = document.createElement("A");
	 x.setAttribute("href", "http://ic.learningneverends.in");
	 x.setAttribute("target", "_blank");
	  return x;
}