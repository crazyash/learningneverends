var pages = [
	["http://ic.learningneverends.in", "images/inr.jpg", "Investment Calculator"],
	["http://loan.learningneverends.in", "images/emi.jpg","EMI Calculator"],
	["comingsoon.html", "images/flames.jpg","Flames"]
];

function createDiv(tag){
	for (let i = 0; i < pages.length; i++) {
	var divTag = document.createElement("DIV");
	var text = document.createElement("P");
	var image = createImage(pages[i][1]);
	var link = createLink(pages[i][0]);
	text.innerHTML=pages[i][2];
	text.setAttribute("class", "app_names");
	divTag.setAttribute("class", "image_box");
	link.appendChild(image);
	divTag.appendChild(link);
	divTag.appendChild(text);
	document.getElementById(tag).appendChild(divTag);
	}
}


function createImage(src){
	  var x = document.createElement("IMG");
	  x.setAttribute("src", src);
	  x.setAttribute("class", "images");
	  x.setAttribute("alt", "Image");
	  return x;
}

function createLink(link){
	 var x = document.createElement("A");
	 x.setAttribute("href", link);
	 x.setAttribute("target", "_blank");
	  return x;
}