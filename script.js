var pages = [
	["http://ic.learningneverends.in", "C:\\Users\\abd1nti\\Pictures\\INR.jpg"],
	["http://www.google.com", "https://i.stack.imgur.com/22WR2.png"]
];

function createDiv(tag){
	for (let i = 0; i < pages.length; i++) {
	var divTag = document.createElement("DIV");
	var image = createImage(pages[i][1]);
	var link = createLink(pages[i][0]);
	divTag.setAttribute("style", "border: 2px solid white; margin: 10px; width: 250px; height:250px; display: inline-block; align:center;");
	link.appendChild(image);
	divTag.appendChild(link);
	document.getElementById(tag).appendChild(divTag);
	}
}


function createImage(src){
	  var x = document.createElement("IMG");
	  x.setAttribute("src", src);
	  x.setAttribute("width", "250px");
	  x.setAttribute("height", "250px");
	  x.setAttribute("alt", "Image");
	  return x;
}

function createLink(link){
	 var x = document.createElement("A");
	 x.setAttribute("href", link);
	 x.setAttribute("target", "_blank");
	  return x;
}