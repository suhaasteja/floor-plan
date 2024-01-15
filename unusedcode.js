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


//close tooltip when popup is open
  map.on('popupclose', function (e) {

      // make the tooltip for this feature visible again
      // but check first, not all features will have tooltips!
      var tooltip = e.popup._source.getTooltip();
      if (tooltip) tooltip.setOpacity(0.9);
      //recenter the map
      map.setView(latLngBounds.getCenter(), map.getZoom()).panBy([0, 500], {animate:false});

  });

  map.on('popupopen', function (e) {

      var tooltip = e.popup._source.getTooltip();
      // not all features will have tooltips!
      if (tooltip)
      {
          // close the open tooltip, if you have configured animations on the tooltip this looks snazzy
          e.target.closeTooltip();
          // use opacity to make the tooltip for this feature invisible while the popup is active.
          e.popup._source.getTooltip().setOpacity(0);
      }

  });
