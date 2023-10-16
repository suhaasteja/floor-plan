function loadDoc() {
 var xhttp = new XMLHttpRequest();
 xhttp.onreadystatechange = function() {
   if (this.readyState == 4 && this.status == 200) {
   myFunction(this);
   }
 };
 xhttp.open("GET", "floor-1.svg", true);
 xhttp.send();
}
function myFunction(xml) {
  var xmlDoc = xml.responseXML;
  var x = xmlDoc.getElementsByTagName("svg");
  console.log(x[0]);
  var svgElement = x[0];
  //var svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  //svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  //svgElement.setAttribute('viewBox', '0 0 200 200');
  var latLngBounds = L.latLngBounds([[37.3348, -121.8845], [37.3362, -121.8855]]);
  var svgOverlay2 = L.svgOverlay(svgElement, latLngBounds, {
      opacity: 0.7,
      interactive: true
  });
  svgOverlay2.addTo(map);

}

var map = L.map('map', {
    renderer: L.svg()
    })
    .setView([37.3355, -121.88496731659605], 19);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 21,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

loadDoc();
