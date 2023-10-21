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
