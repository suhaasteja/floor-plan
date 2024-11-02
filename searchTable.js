function buildSearch(markers){

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
    
    const tableHeaders = "<thead><tr><th></th><th></th><th></th></thead>"
      const tableBody = "<tbody>" + 
        markers.map((obj, i) => {
          const { coordinates, level, popupHead, popupBody } = obj;
          return `<tr><td>${level}</td><td>${popupHead}</td><td>${popupBody}</td></tr>`;
        }).join("") + 
        "</tbody>";
    
      $("#search-table").append(tableHeaders);
      $("#search-table").append(tableBody);
    
      const text = $("#search-table").text();
    
      $('#search-table').DataTable({
        paging: false,       // Enable pagination
        searching: true,    // Enable search bar
        info: false,         // Show entry information
        ordering: false,
        // lengthChange: true  // Allow changing page length
        dom: '<"top"f>rt<"bottom"lp><"clear">',
      });
    
      $("#search-table thead").hide();
      $("#search-table tbody").hide();
    
      $("#search-table").on("search.dt", function (e){
        const searchTerm = $('#dt-search-0').val(); // Get current search term
    
      // Show the table body if there is a search term, otherwise hide it
        if (searchTerm.trim() === "") {
          $("#search-table thead").hide();
          $("#search-table tbody").hide();
        } else {
          $("#search-table thead").show();
          $("#search-table tbody").show();
        }
      })
    
    }