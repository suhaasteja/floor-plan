function buildMap (markers) {
  map = L.map('map', {
      crs: L.CRS.Simple,
      minZoom: -1,
  });

  docLoop(floors, latLngBounds);
  map.fitBounds(latLngBounds);
  map.on('baselayerchange', function(e) {
    currentBaseLayer=e.name;
    onBaseChange();
  });



  //Click on the map to get coordinates - turn on for configuration
  //Maybe add a button for this?
  //map.on('click', onMapClick);

}


function docLoop (floors) {
  floors.forEach (function(svgDoc){
    loadDoc(svgDoc);
  });
  layerControl = L.control.layers(baseMaps, overlayMaps, {
    collapsed: false,
    }).addTo(map);
  initMarkers();

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

  if (svgDoc=="1.svg") { //start on floor 1
    mysvgOverlay.addTo(map);
  };
  layerControl.addBaseLayer(mysvgOverlay, svgDoc.split(".")[0]);
  baseMaps[svgDoc.split(".")[0]]=mysvgOverlay;
}


function loadDoc(svgDoc) {

 var xhttp = new XMLHttpRequest();
 xhttp.onreadystatechange = function() {
   if (this.readyState == 4 && this.status == 200) {
   XMLprocess(this, svgDoc, latLngBounds);
   }
 };
 xhttp.open("GET", svgDoc, true);
 xhttp.send();

}

function onBaseChange(e) {
  deleteMarkers();
  currentMarkers =[];
  //levelMarkers.remove();
  markers.forEach((element, index, array) => {
    if (element.level == currentBaseLayer) {
      var location = element.coordinates.split(',');
      var thisMarker = L.marker(location).bindPopup('<h4>'+element.popupHead+'</h4>'+element.popupBody);
      currentMarkers.push(thisMarker);
    }
  });
  levelMarkers=L.layerGroup(currentMarkers);
  map.removeControl(layerControl);
  layerControl = L.control.layers(baseMaps, overlayMaps, {
    collapsed: false,
    }).addTo(map);
  layerControl.addOverlay(levelMarkers, "Markers");
}

function initMarkers() {
  currentMarkers =[];
  var levelMarkers;
  markers.forEach((element, index, array) => {
    if (element.level == currentBaseLayer) {
      var location = element.coordinates.split(',');
      var thisMarker = L.marker(location).bindPopup('<h4>'+element.popupHead+'</h4>'+element.popupBody);
      currentMarkers.push(thisMarker);
    }
  });
  levelMarkers=L.layerGroup(currentMarkers);
  layerControl.addOverlay(levelMarkers, "Markers");
}



//keep this function as a way to get coordinates for items on the map
function onMapClick(e) {
    alert("You clicked the map at " + e.latlng);
}

// var map is an instance of a Leaflet map
// this function assumes you have added markers as GeoJSON to the map
// it will return an array of all features currently shown in the
// active bounding region.
//for testing

function deleteMarkers() {
  var features = [];
  map.eachLayer( function(layer) {
    if(layer instanceof L.Marker) {
        map.removeLayer(layer);
    }
  });
}


//end of function definitions
var map;
var layerControl;
var floors = ['1.svg', '2.svg'];
var latLngBounds = L.latLngBounds([[0,0], [1000,1000]]);
var baseMaps = {};
var overlayMaps = {};
var markers
var currentBaseLayer = 1;
var currentMarkers = [];

$(document).ready(function() {
  $.getJSON( "markers.json", function(data) {
    markers = data;
    buildMap(markers, floors, latLngBounds);
  });
});
