// TODO use meteor events instead of jquery

Locations = new Meteor.Collection("locations");

var map;

Meteor.startup(function () {
  var body = $(document.body);

  // Submit the name when the submit button is pressed or the
  // user hits enter inside the text box on the info form
  body.on("click", ".info .btn", function () {
    submitName($(this).parent());
  });
  body.on("keydown", ".info .name", function (event) {
    if (event.keyCode === 13) {
      submitName($(this).parent());
    }
  });

  body.on("click", ".btn-delete", function () {
    if (confirm("Are you sure you want to delete this location?")) {

    }
  });

  // Toggle the submit button's enabled-ness as the value in the
  // text box changes
  body.on("input", ".info .name", function () {
    var enabled = $.trim($(this).val()).length > 0;
    $(this).closest(".info").find(".btn").toggleClass("disabled", ! enabled);
  });

  // Initialize the map and add any initial markers to it
  initializeMap();
  Locations.find().forEach(function (location) {
    var position = new google.maps.LatLng(location.lat, location.lng);
    addMarkerToMap(map, position, location);
  });

  Locations.find().observeChanges({
    added: function (id, location) {
      var position = new google.maps.LatLng(location.lat, location.lng);
      if (! window.marker || ! window.marker.getPosition().equals(position)) {
        addMarkerToMap(map, position, location);
      }
    },

    removed: function (id) {
      // TODO
    }

  });
});

function addMarkerToMap(map, position, data) {
  // Create the marker
  var marker = new google.maps.Marker({
    position: position,
    map: map,
    title: location.name,
    animation: google.maps.Animation.DROP
  });

  // Create an info window to be displayed when the marker is clicked
  var info = new google.maps.InfoWindow({
    content: Template.showPosition(data)
  });
  google.maps.event.addListener(marker, "click", function () {
    info.open(map, marker);
  });

  return marker;
}

function submitName(infoSelector) {
  var name = $.trim(infoSelector.find(".name").val());
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
  map = new google.maps.Map(document.getElementById("map"), mapOptions);
}

// Sets all UI elements according to whether a pin is about to
// be dropped
function setDroppingPin(dropping) {
  if (dropping) {
    $(document.body).addClass("dropping");
    map.setOptions({
      draggable: false
    });
  } else {
    $(document.body).removeClass("dropping");
    map.setOptions({
      draggable: true
    });
  }
}

Template.dropMarker.events({
  "click": function (event) {
    var dropping = ! $(document.body).hasClass("dropping");
    setDroppingPin(dropping);
    if (dropping) {
      // When the map is clicked, drop a new marker
      google.maps.event.addListenerOnce(map, "click", function (event) {
        setDroppingPin(false);

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
          content: Template.addPosition()
        });
        window.info.open(map, window.marker);

        // If the window is closed with the close button, remove
        // the marker from the map
        google.maps.event.addListener(window.info, "closeclick", function () {
          window.marker.setMap(null);
        });
      });
    }
  }
});
