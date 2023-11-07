//add global variables
//list floors as SVG files. Floors will appear in the order listed, with the filename as the label
var floorNames = ['Lower Level', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8'];
var latLngBounds = L.latLngBounds([[0,0], [1500,1500]]);
var map;
var layerControl;
var baseMaps = {};
var overlayMaps = {};
var markers;
//use this variable to set the level the page loads on;
var currentBaseLayer = "Level 1";
//use this variable to set marker groups that display on load
var activeLayers = ['Restrooms'];
var lastEventType;
var stopHistory = false;

getQueries()

//start process by loading json file that contains marker data
$(document).ready(function() {

  $.getJSON( "https://sheets.googleapis.com/v4/spreadsheets/1aYZJ-eXUYM3Ak5txxG5dExsKc0RSSOFpWz6vCj2oJ9M/values/A:E?alt=json&key=AIzaSyDl5APEDZ7vrF6sG37qbC7eTz0we45-g5I", function(data) {
    markers = data.values;
    //write response to expected JSON format
    var batchRowValues = data.values;
    var rows = [];
    for (var i=1; i<batchRowValues.length; i++) {
      var rowObject = {};
      for (var j=0; j<batchRowValues[i].length; j++) {
          rowObject[batchRowValues[0][j]] = batchRowValues[i][j];
    }
    rows.push(rowObject);
  }

    markers = rows;
    buildMap(markers);
  });

});

//Primary function - called after the JSON file of markers is loaded
function buildMap (markers) {
  map = L.map('map', {
      crs: L.CRS.Simple,
      minZoom: -1,
      attributionControl: false,
  });
  //use jquery when to make sure all svg files load before beginning to build the map - otherwise layers seem to appear out of order on the control
  $.when( $.ajax("0.svg"),  $.ajax("1.svg"),  $.ajax("2.svg"),  $.ajax("3.svg"),  $.ajax("4.svg"),  $.ajax("5.svg"),  $.ajax("6.svg"), $.ajax("7.svg"), $.ajax("8.svg")).done(function (svg0, svg1, svg2, svg3, svg4, svg5, svg6, svg7, svg8) {
     XMLprocess(svg0[0],0);
     XMLprocess(svg1[0],1);
     XMLprocess(svg2[0],2);
     XMLprocess(svg3[0],3);
     XMLprocess(svg4[0],4);
     XMLprocess(svg5[0],5);
     XMLprocess(svg6[0],6);
     XMLprocess(svg7[0],7);
     XMLprocess(svg8[0],8);
     //create the layer control for the first time
     layerControl = L.control.layers(baseMaps, overlayMaps, {
       collapsed: false,
       position: 'bottomleft'
       }).addTo(map);
     onBaseChange();
  });
  map.fitBounds(latLngBounds);
  //set the function that runs when the level is changed
  map.on('baselayerchange', function(e) {
    currentBaseLayer=e.name;
    onBaseChange();
  });
  //update the URL when layers are changed - allows returning to state
  map.on('overlayadd', function(e) {

    if (lastEventType != 'popstate' && stopHistory == false) {
      getActiveMarkers()
      writeState();
  }
  });
  map.on('overlayremove', function(e) {
    if (lastEventType != 'popstate' && stopHistory == false) {
      getActiveMarkers()
      writeState();
  }
  });
  //reload the page when the back button is used - forces page to rebuild from URL parameters
  window.addEventListener('popstate', function(event) {
    location.reload();
  });


  //Click on the map to get coordinates - turn on while creating data for markers, remove for production
  $('#get-coordinates').on('click', function(e) {
      map.on('click', onMapClick);
  });

}

//process an XML document - runs as part of the initialization. Extracts the SVG data from its XML file and creates a Leaflet layer. Writes the layer to the layer control and adds it to the baseMaps array.
function XMLprocess(xml, number, name) {
  var xmlDoc = xml.responseXML;
  var x = xml.getElementsByTagName("svg");
  var svgElement = x[0];
  var levelNumber = number;
  var levelName = floorNames[levelNumber];
  //console.log(k);
  //console.log(levelName);
  //console.log(floorNames);
  //console.log(floorNames[levelNumber]);

  currentLevel = L.svgOverlay(svgElement, latLngBounds, {
      interactive: true,
      id: levelName
  });
  //console.log(floorNames[i]);
   //start on the floor set in the variables above
  if (levelName == currentBaseLayer) {
    currentLevel.addTo(map);
  };
  //layerControl.addBaseLayer(currentLevel, levelName);
  baseMaps[levelName]=currentLevel;
}


//this function runs every time the level is changed. It loops through the markers to create the layer control. Also runs on initialization
function onBaseChange(e) {
  console.log('onBaseChange ran');
  stopHistory = true;
  lastEventType = event.type;
  //change the header;
  $('#map-header').find('h3').text('King Library -  ' + currentBaseLayer);
  //populates an array of active layers called activeLayers. Active layers stay active even when switching levels, and even if the group isn't present on every floor
  if (lastEventType !="popstate") {
    getActiveMarkers();
    writeState();
  };
  //clear all markers from the previous level
  deleteMarkers();
  //remove the layer control - this works better than trying to remove the layers from the control
  map.removeControl(layerControl);
  overlayMaps={};

  //start a new layer control - will have the levels but no markers yet
  layerControl = L.control.layers(baseMaps, overlayMaps, {
    collapsed: false,
    position: 'bottomleft'
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
        var popupBodyText
        if (element.popupBody == undefined) {
          popupBodyText = "";
        }
        else {
          popupBodyText = element.popupBody;
        }
        var thisMarker = L.marker(location).bindPopup('<h4>'+element.popupHead+'</h4>'+popupBodyText);
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
    stopHistory = false;
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

//get queries from URL
function getQueries() {
  var queryString = window.location.search;
    if(queryString) {
      var urlParams = new URLSearchParams(queryString);
      currentBaseLayer = urlParams.get('level').replace('%20',' ');
      activeLayers = urlParams.get('markers').split(',');
    }
}

//writes map state to the URL so page can be reloaded
function writeState() {
  window.history.pushState(null, null, '?level='+currentBaseLayer+'&markers='+activeLayers);
}

//end of function definitions
