function docLoop (floors) {

  floors.forEach (function(svgDoc){
    loadDoc(svgDoc);
    var key=svgDoc;
    //floorLayers[key]='xml';
  });

};

function XMLprocess(xml, svgDoc) {
  var xmlDoc = xml.responseXML;
  var x = xmlDoc.getElementsByTagName("svg");
  var svgElement = x[0];
  //var svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  //svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  //svgElement.setAttribute('viewBox', '0 0 200 200');

  var mysvgOverlay = L.svgOverlay(svgElement, latLngBounds, {
      //opacity: 0.7,
      interactive: true
  });
  mysvgOverlay.addTo(map);
  floorArray.push(mysvgOverlay);
  floorLayers[svgDoc.split(".")[0]]=mysvgOverlay;
  layerControl.addBaseLayer(mysvgOverlay, svgDoc.split(".")[0]);
}


function loadDoc(svgDoc) {

 var xhttp = new XMLHttpRequest();
 xhttp.onreadystatechange = function() {
   if (this.readyState == 4 && this.status == 200) {
   XMLprocess(this, svgDoc);
   }
 };
 xhttp.open("GET", svgDoc, true);
 xhttp.send();

}


//loadDoc('Floor_1_edit.svg');
//loadDoc('Floor_2_edit.svg');
var map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -1,
});

var floors = ['Floor_1_edit.svg', 'Floor_2_edit.svg'];
var floorArray = []
var baseMaps = {};
var overlayMaps = {};
var floorLayers = {};
var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
docLoop(floors);
var latLngBounds = L.latLngBounds([[0,0], [1000,1000]]);
console.log(floorArray);
map.fitBounds(latLngBounds);
console.log(floorLayers);


//keep this function as a way to get coordinates for items on the map
function onMapClick(e) {
    alert("You clicked the map at " + e.latlng);
}

//map.on('click', onMapClick);

var marker = L.marker([116, 396]).addTo(map).bindPopup("<b>Campus Entrance</b><br>Enter here from SJSU Campus.");
