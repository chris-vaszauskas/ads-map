Meteor.startup(function () {
  initializeMap();
});

function initializeMap() {
  var mapOptions = {
    center: new google.maps.LatLng(-34.397, 150.644),
    zoom: 8,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById("map"), mapOptions);

  // Whenever a long press occurs on the map, drop a marker in the
  // position where the long press occurred
  var longpressTimeout;
  google.maps.event.addListener(map, 'mousedown', function (event) {
    longpressTimeout = Meteor.setTimeout(function () {
      var marker = new google.maps.Marker({
        position: event.latLng,
        map: map,
        animation: google.maps.Animation.DROP,
        title: 'Chris'
      });
    }, 1000);  // a long press occurs after 1 second
  });

  // If the mouse is released or moved, the long press is cancelled
  google.maps.event.addListener(map, 'mouseup', function () {
    Meteor.clearTimeout(longpressTimeout);
  });
  google.maps.event.addListener(map, 'mousemove', function () {
    Meteor.clearTimeout(longpressTimeout);
  });
}
