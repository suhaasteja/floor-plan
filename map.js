//add global variables
//list floors as SVG files. Floors will appear in the order listed, with the filename as the label
var floorNames = ['Lower Level', 'Level 1', 'Level 1 Mezzanine', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8'];
var latLngBounds = L.latLngBounds([[0,0], [2000,2000]]);
var latLngBoundsOversize = L.latLngBounds([[-260,-300], [2000,2030]]);
var mapBounds = L.latLngBounds([[-100,-100], [2100,2100]]);
var map;
var layerControl;
var baseMaps = {};
var overlayMaps = {};
var markers;
//use this variable to set the level the page loads on;
var currentBaseLayer = "Level 1";
//use this variable to set marker groups that display on load
var activeLayers = [];//list marker groups shown by default - currently disabled
var queryString;
var urlParams;
var legacyFloor;
var lastEventType;
var stopHistory = false;
//map legacy floors from old map to new values - goal is to make old inbound links work
const legacyFloors = new Map([
  ["L", "Lower Level"],
  ["M", "Level 1 Mezzanine"],
  ["G", "Level 1"],
  ["2", "Level 2"],
  ["3", "Level 3"],
  ["4", "Level 4"],
  ["5", "Level 5"],
  ["6", "Level 6"],
  ["7", "Level 7"],
  ["8", "Level 8"]
]);




//start process by loading json file that contains marker data
(function ($) {
  console.log('Javascript/jQuery works!');
getQueries();

$(document).ready(function() {

  google.charts.load('current', {
    packages: ['corechart']
      }).then(function () {
        var query = new google.visualization.Query('https://docs.google.com/spreadsheets/d/1nkYWE6fAV1PGb-YexmtkBOa8NHV4UijWh4e5lM051Q4/gviz/tq?gid=0&headers=1');
    query.send(function (response) {
      if (response.isError()) {
        console.log('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
        return;
      };
      var dt = response.getDataTable();
      var markerJsonData = dt.toJSON();
      markerJsonData = JSON.parse(markerJsonData);
      markersData = markerJsonData.rows;
      markersFields = markerJsonData.cols;
      var rows = [];
      markersData.forEach((marker, i) =>
      {
        var rowObject = {};
        for (var j=0; j<marker.c.length; j++) {
            if (marker.c[j]) {
              rowObject[markersFields[j].label] = marker.c[j].v;
            }
            else {
              rowObject[markersFields[j].label] = "";
            }
        };
        rows.push(rowObject);
      });
      markers = rows;
      buildMap(markers);
      //resizeToolTips();
    });
  });



});
})(jQuery);

//Primary function - called after the JSON file of markers is loaded
function buildMap (markers) {
  map = L.map('map', {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 2,
      zoomSnap: 0.1,
      scrollWheelZoom: false,
      attributionControl: false,
      center: latLngBounds.getCenter(),
      maxBounds: mapBounds,
      maxBoundsViscosity: 1.0

  });
  //use jquery when to make sure all svg files load before beginning to build the map - otherwise layers seem to appear out of order on the control
  $.when( $.ajax("https://d2jv02qf7xgjwx.cloudfront.net/sites/841/include/king-level-0.svg"),  $.ajax("https://d2jv02qf7xgjwx.cloudfront.net/sites/841/include/king-level-1.svg"), $.ajax("https://d2jv02qf7xgjwx.cloudfront.net/sites/841/include/king-level-1M.svg"), $.ajax("https://d2jv02qf7xgjwx.cloudfront.net/sites/841/include/king-level-2.svg"),  $.ajax("https://d2jv02qf7xgjwx.cloudfront.net/sites/841/include/king-level-3.svg"),  $.ajax("https://d2jv02qf7xgjwx.cloudfront.net/sites/841/include/king-level-4.svg"),  $.ajax("https://d2jv02qf7xgjwx.cloudfront.net/sites/841/include/king-level-5.svg"),  $.ajax("https://d2jv02qf7xgjwx.cloudfront.net/sites/841/include/king-level-6.svg"), $.ajax("https://d2jv02qf7xgjwx.cloudfront.net/sites/841/include/king-level-7.svg"), $.ajax("https://d2jv02qf7xgjwx.cloudfront.net/sites/841/include/king-level-8.svg")).done(function (svg0, svg1, svg1M, svg2, svg3, svg4, svg5, svg6, svg7, svg8) {
     XMLprocess(svg0[0],0);
     XMLprocess(svg1[0],1);
     XMLprocess(svg1M[0],2);
     XMLprocess(svg2[0],3);
     XMLprocess(svg3[0],4);
     XMLprocess(svg4[0],5);
     XMLprocess(svg5[0],6);
     XMLprocess(svg6[0],7);
     XMLprocess(svg7[0],8);
     XMLprocess(svg8[0],9);
     //create the layer control for the first time
     layerControl = L.control.layers(baseMaps, overlayMaps, {
       collapsed: false,
       position: 'bottomleft'
       }).addTo(map);

     onBaseChange();
    map.fitBounds(latLngBounds);//.panBy([0, 500], {animate:false});
  });



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
  map.on('zoomstart', function(e) {
    prepareToResizeToolTips();
  });

  map.on('zoomend',  function(e) {
    resizeToolTips(500);
  });

  //reload the page when the back button is used - forces page to rebuild from URL parameters
  window.addEventListener('popstate', function(event) {
    location.reload();
  });


  //Click on the map to get coordinates - turn on while creating data for markers, remove for production
  $('#get-coordinates').on('click', function(e) {
      map.on('click', onMapClick);
  });

  //move controls to custom locations
  //zoom

    var newParent = document.getElementById('zoom');
    var oldParent = document.getElementsByClassName("leaflet-top leaflet-left");


    while (oldParent[0].childNodes.length > 0) {
            newParent.appendChild(oldParent[0].childNodes[0]);
       }

      //fixed pane for popups
      var pane = map.createPane('fixed', document.getElementById('map'));
      //resize toolTips for current Zoom
      //resizeToolTips();
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

  if (levelNumber == 0) {
    currentLevel = L.svgOverlay(svgElement, latLngBoundsOversize, {
        interactive: true,
        id: levelName
    });
  }
  else {
  currentLevel = L.svgOverlay(svgElement, latLngBounds, {
      interactive: true,
      id: levelName
  });
}
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
  //change the header - not currently used
  //$('#map-header').find('h3').text('King Library -  ' + currentBaseLayer);
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
        var location = [0,0]
        if (element.coordinates) {
          location = element.coordinates.split(',');
        };
        //popup HTML
        var popupBodyText =""
        if (element.popupBody) {
          popupBodyText = '<p>'+element.popupBody+'</p>';
        }
        else {
          popupBodyText = element.popupBody;
        };
        var popupBodyImage = ""
        if (element.imageURL) {
          popupBodyImage = '<img src="'+element.imageURL+'">';
        }

        var popupButton = ""
        if (element.buttonURL) {
          popupButton = '<a href="'+element.buttonURL+'"><button>More</button></a>';
        }



        //handle marker formatting from spreadsheet
        var size =[];
        size.push(element.markerW,element.markerW);
        var size = element.markerW;
        var markerClassName = "icon";
        var markerTextHeight = 0.5;
        var markerContent = element.markerText;
        if (element.markerClass) {
          markerClassName=element.markerClass
          if (markerClassName="number") {
            markerTextHeight = 0.35;
            markerContent = element.roomNumber;
          };
        };
        var markerColor = "#000";
        if (element.markerColor) {
          markerColor = element.markerColor;
        }
        var markerTextColor = "tooltip-white-text";
        if (element.textColor == "black") {
          markerTextColor = "tooltip-black-text"
        }
        var markerIconPosition = "tooltip-icon-bottom"
        if (element.iconPosition == "left") {
          markerIconPosition = "tooltip-icon-left"
        }
        else if (element.iconPosition == "right") {
          markerIconPosition = "tooltip-icon-right"
        }

        var markerBackgroundOpacity = 1;
        if (element.opacity < 1) {
          markerBackgroundOpacity = element.opacity;
        }
        var bigFont = ""
        if (element.fontSize == "big") {
          bigFont = "tooltip-big-font"
        }
        else if (element.fontSize == "medium") {
          bigFont = "tooltip-med-font"
        }
        var bigIcon = ""
        if (size > 59) {
          bigIcon = "tooltip-big-circle"
        }


        var popup = L.popup({
            pane: 'fixed', // created above
            className: 'popup-fixed',
            autoPan: false,
        })//add options here

          .setContent('<div class = "modal-content"><h4>'+element.popupHead+'</h4><div class = "popUpText">'+popupBodyText+'</div><div class="popUpImage">'+popupBodyImage+'</div><div class="popUpButton">'+popupButton+'</div></div>');
        var circleContent = '<span class="circleIcon">'+markerContent+'</span>'
        var thisMarker = L.circle(location, {alt:element.popupHead, radius:size, color:markerColor, fillOpacity:markerBackgroundOpacity, opacity:markerBackgroundOpacity}).bindPopup(popup).bindTooltip(circleContent, {permanent:true, direction:"center", className:"circle-tooltip " + markerTextColor+ " " + bigIcon});
        if (element.markerShape == "square") {
          var bounds = [location, [Number(location[0])+element.rectangleH, Number(location[1])+size]];
          var squareContent = '<span class="squareText">'+element.popupHead+'</span><span class="squareIcon">'+markerContent+'</span>'
          thisMarker = L.rectangle(bounds, {alt:element.popupHead, color:markerColor, fillOpacity:markerBackgroundOpacity, opacity:markerBackgroundOpacity}).bindPopup(popup).bindTooltip(squareContent, {permanent:true, direction:"center", className:"square-tooltip " + markerTextColor + " " +  markerIconPosition + " " + bigFont});
        }


        //var thisMarker = L.marker.svgMarker(location, {alt:element.popupHead, pane:"overlayPane", iconOptions: { color: markerColor, circleFillColor: markerColor, iconSize: size, weight: 0, circleRatio:1, circleWeight:0, circleFillOpacity: 1, opacity: 0, fillOpacity: 0, fontSize:element.markerFontSize, circleText:markerContent, fontColor: markerTextColor, className: markerClassName, textHeight: markerTextHeight } }).bindPopup(popup).bindTooltip(element.popupHead);
        //try pane:overlay-pane, after other changes
        //add the marker to a list of markers that belong to the current group
        currentGroupArray.push(thisMarker);
      }
    });
    //add the array of all markers in the group to the layer control
    var currentLayerGroup = L.layerGroup(currentGroupArray);
    layerControl.addOverlay(currentLayerGroup, currentGroup);
    currentLayerGroup.addTo(map);
    //if the group was active the last time it appeared, or is set to be active by default on load, add it to the map on the new level - active groups should carry over when you change floors.
    //if (activeLayers.includes(currentGroup)) {
      //currentLayerGroup.addTo(map);
    //}
  });
    stopHistory = false;
    //add classes to layer selectors for styling
    $(".leaflet-control-layers-overlays label").each(function() {
        $(this).addClass($(this).text());
    });

    //move layers control

    var newParentLayers = document.getElementById('layers');
    var oldParentLayers = document.getElementsByClassName("leaflet-bottom leaflet-left");

    while (oldParentLayers[0].childNodes.length > 0) {
            newParentLayers.appendChild(oldParentLayers[0].childNodes[0]);
     }
     //overlay layer control - currently hidden using CSS
     $(".leaflet-control-layers-base").wrap("<details id='layers-accordion'></details>")
     $("#layers-accordion").append("<summary>"+currentBaseLayer+"</summary>");

     $(".leaflet-control-layers-overlays").wrap("<details id='overlays-accordion'></details>")
     $("#overlays-accordion").append("<summary>On This Floor</summary>");
     $("#overlays-accordion").wrap("<div id='overlays-outer'></div>");

     //adjust tooltip size and position based on zoom level
     $(".leaflet-tooltip").css("opacity", 0);
     resizeToolTips(1000);
}
//end onBaseChange


//keep this function as a way to get coordinates for items on the map - turned on with button on dev version
function onMapClick(e) {
    alert("You clicked the map at " + e.latlng.lat + ', ' + e.latlng.lng);

}

//function to delete all markers when changing layers
function deleteMarkers() {
  var features = [];
  map.eachLayer( function(layer) {
    if(layer instanceof L.Marker) {
        map.removeLayer(layer);
    }
    if(layer instanceof L.Circle) {
        map.removeLayer(layer);
    }
    if(layer instanceof L.Rectangle) {
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
  queryString = window.location.search;
    if(queryString) {
      urlParams = new URLSearchParams(queryString);
      if (urlParams.get('f')) {
        legacyFloor = urlParams.get('f');
        if (legacyFloors.get(legacyFloor)) {
          currentBaseLayer = legacyFloors.get(legacyFloor);
          urlParams.delete('f');
        }
    }
    if (urlParams.get('n')) { //get parameters from Primo links
      var locations = {'1st':'1','2nd':'2','3rd':'3','4th':'4','5th':'5','6th':'6','7th':'7','8th':'8','Lower Level':'Lower Level'};
      var keys = Object.keys(locations);
      let param_n  = urlParams.get('n');
      for (let i = 0; i < keys.length; i++) {
        key = keys[i];
        if (param_n.includes(key)) {
            let value = locations[key];
            primoFloor = value;
            if (key != 'Lower Level') {
                primoFloor = 'Level ' + value;
            }
            break;
          }
      }
      currentBaseLayer = primoFloor;
      urlParams.delete('n');
    }

      if ((urlParams).get('level')) {
        currentBaseLayer = urlParams.get('level').replace('%20',' ');
      }

      //activeLayers = urlParams.get('markers').split(',');
    }
}

//writes map state to the URL so page can be reloaded
function writeState() {
  //urlParams = new URLSearchParams(queryString);
  if (urlParams) {
    urlParams.set('level', currentBaseLayer)
      window.history.pushState(null, null, '?'+urlParams);
}
else {
    window.history.pushState(null, null, '?level='+currentBaseLayer);
}

}

function prepareToResizeToolTips() {
  $(".leaflet-tooltip").css("font-size", "0px");
  $(".leaflet-tooltip").css("width", "0px");
  $(".leaflet-tooltip").css("opacity", 0);
}

function resizeToolTips(time) {
  console.log('resize!');
  var currentZoom = map.getZoom();
  var myZoom =currentZoom+3;
  var shift =  -2-myZoom*13;
  //formula to scale fonts for different zoom levels
  var fontShift =40-31*(myZoom)+14*(myZoom*myZoom)
  console.log(currentZoom);
  console.log(fontShift);
  //rescale tooltips - needed during zoom
  //font size for all - variation is achieved by CSS on spans
  $(".leaflet-tooltip").css("font-size", fontShift+"px");
  $(".leaflet-tooltip").css("width", "auto");
  //position icon within circle marker
  $(".circle-tooltip").css("left", -fontShift*.4+"px");
  $(".circle-tooltip").css("top", -fontShift*.4+"px");
  //position icon with big circle marker, circle of 60px or greater
  $(".tooltip-big-circle").css("left", -fontShift/1.33+"px");
  $(".tooltip-big-circle").css("top", -fontShift/1.33+"px");
  //squares and rectangles - standard iconSize
  $(".tooltip-icon-bottom").css("left", -fontShift+"px");
  $(".tooltip-icon-bottom").css("top", -fontShift+"px");
  $(".tooltip-icon-left").css("left", -fontShift*1.25+"px");
  $(".tooltip-icon-right").css("left", -fontShift*1.25+"px");
  $(".tooltip-icon-left, .tooltip-icon-right").css("top", -fontShift/2+"px");
  //big size
  $(".tooltip-big-font.tooltip-icon-bottom").css("left", -fontShift*2+"px");
  $(".tooltip-big-font.tooltip-icon-bottom").css("top", -fontShift*2+"px");
  $(".tooltip-big-font.tooltip-icon-left").css("left", -fontShift*3+"px");
  $(".tooltip-big-font.tooltip-icon-right").css("left", -fontShift*3+"px");
  $(".tooltip-big-font.tooltip-icon-left, .tooltip-big-font.tooltip-icon-right").css("top", -fontShift+"px");
  //medium size
  $(".tooltip-med-font.tooltip-icon-bottom").css("left", -fontShift*1+"px");
  $(".tooltip-med-font.tooltip-icon-bottom").css("top", -fontShift*1.5+"px");
  $(".tooltip-med-font.tooltip-icon-left").css("left", -fontShift*2+"px");
  $(".tooltip-med-font.tooltip-icon-right").css("left", -fontShift*2+"px");
  $(".tooltip-med-font.tooltip-icon-left, .tooltip-med-font.tooltip-icon-right").css("top", -fontShift*.75+"px");
  //animate restoring opacity - makes resizing less abrupt
  $(".leaflet-tooltip").animate({
    opacity: 1,
  }, time, function() {
    // Animation complete.
  });

}

//end of function definitions
