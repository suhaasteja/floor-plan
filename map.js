//add global variables
//list floors as SVG files. Floors will appear in the order listed, with the filename as the label
var floors = ['1.svg', '2.svg'];
var latLngBounds = L.latLngBounds([[0,0], [1000,1000]]);
var map;
var layerControl;
var baseMaps = {};
var overlayMaps = {};
var markers;
//use this variable to set the level the page loads on;
var currentBaseLayer = 1;
//use this variable to set marker groups that display on load
var activeLayers = ['Restrooms'];

//start process by loading json file that contains marker data
$(document).ready(function() {
  $.getJSON( "markers.json", function(data) {
    markers = data;
    buildMap(markers, floors, latLngBounds);
  });
});

//Primary function - called after the JSON file of markers is loaded
function buildMap (markers) {
  map = L.map('map', {
      crs: L.CRS.Simple,
      minZoom: -1,
  });

  docLoop(floors);
  map.fitBounds(latLngBounds);
  //set the function that runs when the level is changed
  map.on('baselayerchange', function(e) {
    currentBaseLayer=e.name;
    onBaseChange();
  });

  //Click on the map to get coordinates - turn on while creating data for markers, remove for production
  $('#get-coordinates').on('click', function(e) {
      map.on('click', onMapClick);
  });

}

//loop through an array of SVG files
function docLoop (floors) {
  floors.forEach (function(svgDoc){
    loadDoc(svgDoc);
  });
  //create the layer control for the first time
  layerControl = L.control.layers(baseMaps, overlayMaps, {
    collapsed: false,
    position: 'bottomright'
    }).addTo(map);
  onBaseChange();
};

//process an XML document - runs as part of the initialization. Extracts the SVG data from its XML file and creates a Leaflet layer. Writes the layer to the layer control and adds it to the baseMaps array.
function XMLprocess(xml, svgDoc) {
  var xmlDoc = xml.responseXML;
  var x = xmlDoc.getElementsByTagName("svg");
  var svgElement = x[0];

  var mysvgOverlay = L.svgOverlay(svgElement, latLngBounds, {
      interactive: true
  });
   //start on the floor set in the variables above
  if (svgDoc== currentBaseLayer+".svg") {
    mysvgOverlay.addTo(map);
  };
  layerControl.addBaseLayer(mysvgOverlay, svgDoc.split(".")[0]);
  baseMaps[svgDoc.split(".")[0]]=mysvgOverlay;
}

//get an SVG document
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

//this function runs every time the level is changed. It loops through the markers to create the layer control. Also runs on initialization
function onBaseChange(e) {
  //populates an array of active layers called activeLayers. Active layers stay active even when switching levels, and even if the group isn't present on every floor
  getActiveMarkers();
  //clear all markers from the previous level
  deleteMarkers();
  //remove the layer control - this works better than trying to remove the layers from the control
  map.removeControl(layerControl);
  overlayMaps={};

  //start a new layer control - will have the levels but no markers yet
  layerControl = L.control.layers(baseMaps, overlayMaps, {
    collapsed: false,
    position: 'bottomright'
    }).addTo(map);
  //create a new object with only the markers for this level
  var myMarkers = markers.filter((item) => item.level == currentBaseLayer);
  //create a list of groups present on the current level and sort the list alphabetically
  var groups = [...new Set(myMarkers.map(item => item.group))];
  groups.sort();
  //Create layer groups for each group of markers - loop through the list of groups represented
  groups.forEach((element, index, array) => {
    var currentGroup=element;
    var currentGroupArray = [];
    //add markers to the layer groups - loop through all markers and select the ones that are part of the current group
    myMarkers.forEach((element, index, array) => {
      //test if the marker is part of the current group
      if (element.group == currentGroup) {
        //create the marker layer
        var location = element.coordinates.split(',');
        var thisMarker = L.marker(location).bindPopup('<h4>'+element.popupHead+'</h4>'+element.popupBody);
        //add the marker to a list of markers that belong to the current group
        currentGroupArray.push(thisMarker);
      }
    });
    //add the array of all markers in the group to the layer control
    var currentLayerGroup = L.layerGroup(currentGroupArray);
    layerControl.addOverlay(currentLayerGroup, currentGroup);
    //if the group was active the last time it appeared, or is set to be active by default on load, add it to the map on the new level - active groups should carry over when you change floors.
    if (activeLayers.includes(currentGroup)) {
      currentLayerGroup.addTo(map);
    }
  });
}

//keep this function as a way to get coordinates for items on the map - turned on with button on dev version
function onMapClick(e) {
    alert("You clicked the map at " + e.latlng);
}

//function to delete all markers when changing layers
function deleteMarkers() {
  var features = [];
  map.eachLayer( function(layer) {
    if(layer instanceof L.Marker) {
        map.removeLayer(layer);
    }
  });
}

//get status of marker controls - uses jquery to get status of checkbox and maintains a list of checked boxes
function getActiveMarkers() {
  $('.leaflet-control-layers-overlays .leaflet-control-layers-selector').each(function() {
    var value = $(this).next().text().trimStart();
    if ($(this).is(":checked")) {
      //if the input is checked
      if (activeLayers.includes(value)) {
        //do nothing - leave it in the list
      }
      else {
        //add it to the list
        activeLayers.push(value);
      }
    }
    else {
      //if the input is not checked
      if (activeLayers.includes(value)) {
        //if it on the active list, remove it
        var index = activeLayers.indexOf(value);
        activeLayers.splice(index,1);
      }
    }
  });
}

//end of function definitions
