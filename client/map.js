Locations = new Meteor.Collection('locations');

Meteor.startup(function () {
  // Submit the name when the submit button is pressed or the
  // user hits enter inside the text box on the info form
  $(document.body).on('click', '.info .btn', function () {
    submitName($(this).parent());
  });
  $(document.body).on('keydown', '.info .name', function (event) {
    if (event.keyCode === 13) {
      submitName($(this).parent());
    }
  });

  // Toggle the submit button's enabled-ness as the value in the
  // text box changes
  $(document.body).on('input', '.info .name', function () {
    var enabled = $(this).val().length > 0;
    $(this).closest('.info').find('.btn').toggleClass('disabled', ! enabled);
  });

  // Initialize the map and add any initial markers to it
  var map = initializeMap();
  Locations.find().forEach(function (location) {
    var position = new google.maps.LatLng(location.lat, location.lng);
    addMarkerToMap(map, position);
  });

  //Deps.autorun(function () {
    Locations.find().observeChanges({
      added: function (id, location) {
        var position = new google.maps.LatLng(location.lat, location.lng);
        if (! window.marker || ! window.marker.getPosition().equals(position)) {
          addMarkerToMap(map, position);
        }
      },

      removed: function (id) {
        // TODO
      }

    });
  //});
});

function addMarkerToMap(map, position) {
  var marker = new google.maps.Marker({
    position: position,
    map: map,
    title: location.name,
    animation: google.maps.Animation.DROP
  });
  return marker;
}

function submitName(infoSelector) {
  var name = $.trim(infoSelector.find('.name').val());
  if (name.length > 0) {
    var position = window.marker.getPosition();
    Locations.insert({
      lat: position.lat(),
      lng: position.lng(),
      name: name
    });
    window.info.close();
  }
}

function initializeMap() {
  var mapOptions = {
    center: new google.maps.LatLng(31.548614, -97.149073),
    zoom: 18,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById("map"), mapOptions);

  // Whenever a long press occurs on the map, drop a marker in the
  // position where the long press occurred
  var longpressTimeout;
  google.maps.event.addListener(map, 'mousedown', function (event) {
    longpressTimeout = Meteor.setTimeout(function () {
      // Remove the marker that is currently being editied (if it exists)
      if (window.marker) {
        window.marker.setMap(null);
      }

      // Create a marker on the map
      window.marker = new google.maps.Marker({
        position: event.latLng,
        map: map,
        animation: google.maps.Animation.DROP
      });

      // Display an info window above the marker
      window.info = new google.maps.InfoWindow({
        content: Template.infoWindow()
      });
      window.info.open(map, window.marker);

      // If the window is closed with the close button, remove
      // the marker from the map
      google.maps.event.addListener(window.info, 'closeclick', function () {
        window.marker.setMap(null);
      });

    }, 500);  // milliseconds for a long press
  });

  // If the mouse is released or moved, the long press is cancelled
  google.maps.event.addListener(map, 'mouseup', function () {
    Meteor.clearTimeout(longpressTimeout);
  });
  google.maps.event.addListener(map, 'mousemove', function () {
    Meteor.clearTimeout(longpressTimeout);
  });

  return map;
}
