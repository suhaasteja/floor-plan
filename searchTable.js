function buildSearch(markers, map, currentBaseLayer) {
  //   {
  //     "level": "Lower Level",
  //     "group": "",
  //     "coordinates": "1865, 168",
  //     "popupHead": "Lower Level",
  //     "popupBody": "Periodicals; microfilm and microfiche; government publications; prototyping lab; grad lab",
  //     "imageURL": "",
  //     "buttonURL": "",
  //     "markerColor": "#c40000",
  //     "opacity": 0,
  //     "textColor": "",
  //     "markerShape": "square",
  //     "iconPosition": "",
  //     "markerText": "",
  //     "fontSize": "",
  //     "markerW": 400,
  //     "rectangleH": 200,
  //     "roomNumber": "",
  //     "markerH": "",
  //     "circleRatio": "",
  //     "markerFontSize": "",
  //     "markerClass": null
  // }

  const tableHeaders = "<thead><tr><th></th><th></th><th></th><th></th></tr></thead>"; // need this to follow table structure
  const tableBody =
    "<tbody>" +
    markers
      .map((obj, i) => {
        const { coordinates, level, popupHead, popupBody } = obj;
        return `<tr><td style = "display: none">${coordinates}</td><td>${level}</td><td>${popupHead}</td><td>${popupBody}</td></tr>`;
      })
      .join("") +
    "</tbody>";

  $("#search-table").append(tableHeaders);
  $("#search-table").append(tableBody);

  const text = $("#search-table").text();

  $("#search-table").DataTable({
    paging: false, // Enable pagination
    searching: true, // Enable search bar
    info: false, // Show entry information
    ordering: false,
    dom: '<"top"f>rt<"bottom"lp><"clear">',
  });

  $("#search-table thead").hide();
  $("#search-table tbody").hide();

  $("#search-table").on("search.dt", function (e) {
    const searchTerm = $("#dt-search-0").val(); // Get current search term

    // Show the table body if there is a search term, otherwise hide it
    if (searchTerm.trim() === "") {
      $("#search-table thead").hide();
      $("#search-table tbody").hide();
    } else {
      $("#search-table thead").show();
      $("#search-table tbody").show();
    }
  });

  let table = new DataTable("#search-table");
  table.on("click", "tbody tr", function () {
    let data = table.row(this).data();
    const [coordinates, level, head, body] = data;
    console.log(data, coordinates, level, head, body);
    checkForLevelChange(level, currentBaseLayer);
    addMarker(map, coordinates, head, body);
    map.fitBounds(latLngBounds);
  });

}


function checkForLevelChange(level, currentBaseLayer){
  // check if we are in the same level; else change level
  console.log("level", level);
  
}

function addMarker(map, coordinates, popupHead, popupBody) {
  
  const [lat, lng] = coordinates.split(',').map(Number); // Parse coordinates
  
  // Define a custom SVG icon for more styling options
  const customIcon = L.divIcon({
      className: 'custom-marker', // Add a custom CSS class for the marker
      html: `<div class="marker-icon"></div>`, // Custom HTML for the icon
      iconSize: [40, 40],
      // popupAnchor: [0, -20]
  });

  // Add the marker with the custom icon
  const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

  // Bind styled popup content and open it
  marker.bindPopup(`<b>${popupHead}</b><br><span class="popup-body">${popupBody}</span>`, {
    className: 'custom-popup' // Add a custom CSS class to the popup
  }).openPopup();

  // Listen for popup close to remove marker
  marker.on('popupclose', function () {
      map.removeLayer(marker); // Remove the marker when the popup is closed
  });

  return marker; 
}