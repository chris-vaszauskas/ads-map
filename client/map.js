// TODO use meteor events instead of jquery
// TODO remove autopublish package
// TODO google analytics

Locations = new Meteor.Collection("locations");

var map_;          // the google map on the page
var marker_;       // the google maps marker that is currently focused
var info_;         // the google maps info window that is currently focused
var markers_ = []; // the markers currently being displayed on the map

Meteor.startup(function () {
  var body = $(document.body);

  // Submit the name when the submit button is pressed or the
  // user hits enter inside the text box on the info form
  body.on("click", ".info .btn", function () {
    var name = $(this).val();
    submitName(name);
  });
  body.on("keydown", ".info .name", function (event) {
    if (event.keyCode === 13) {
      var name = $(this).val();
      submitName(name);
    }
  });

  body.on("click", ".btn-delete", function () {
    if (confirm("Are you sure you want to delete this location?")) {

    }
  });

  // Toggle the submit button's enabled-ness as the value in the
  // text box changes
  body.on("input", ".info .name", function () {
    var name = $(this).val();
    var enabled = Boolean(validateName(name));
    $(this).closest(".info").find(".btn").toggleClass("disabled", ! enabled);
  });

  // Initialize the map and add initial markers to it
  initializeMap();
  Locations.find().forEach(function (location) {
    var position = new google.maps.LatLng(location.lat, location.lng);
    addMarkerToMap(position, location);
  });

  // Observe changes to the array of locations on the server, adding and removing
  // markers as necessary
  Locations.find().observeChanges({
    added: function (id, location) {
      var position = new google.maps.LatLng(location.lat, location.lng);
      if (! marker_ || ! marker_.getPosition().equals(position)) {
        addMarkerToMap(position, location);
      }
    },

    removed: function (id) {
      // TODO
    }
  });
});

// Ensures a name is valid. Returns the valid name or false if a
// name is invalid
function validateName(name) {
  name = $.trim(name);
  if (name.length > 0) {
    return name;
  }
  return false;
}

// Adds a marker to the map at @position. If @content is set, attaches
// an info window to the marker with its content set to @content
function addMarkerToMap(position, content) {
  // Create the marker
  var marker = new google.maps.Marker({
    position: position,
    map: map_,
    title: location.name,
    animation: google.maps.Animation.DROP
  });

  // Attach an info window to the marker
  if (content) {
    attachInfoWindowToMarker(marker, content);
  }

  markers_.push(marker);
  return marker;
}

// When @marker is clicked, displays an info window with @content
function attachInfoWindowToMarker(marker, content) {
  var info = new google.maps.InfoWindow({
    content: Template.showPosition(content)
  });
  google.maps.event.addListener(marker, "click", function () {
    info.open(map_, marker);
  });
}

// Inserts a new record into the database using the focused
// marker as the location and @name as the name
function submitName(name) {
  name = validateName(name);
  if (name) {
    var position = marker_.getPosition();
    Locations.insert({
      lat: position.lat(),
      lng: position.lng(),
      name: name
    });
    info_.close();

    attachInfoWindowToMarker(marker_, name);
    markers_.push(marker);
  }
}

function initializeMap() {
  var mapOptions = {
    center: new google.maps.LatLng(31.548614, -97.149073),
    zoom: 18,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map_ = new google.maps.Map(document.getElementById("map"), mapOptions);
}

// Sets all UI elements according to whether a pin is about to
// be dropped
function setDroppingPin(dropping) {
  $(document.body).toggleClass("dropping", dropping);
  map_.setOptions({
    draggable: ! dropping
  });
}

var mapClickListener;
Template.dropMarker.events({

  "click": function (event) {
    var dropping = ! $(document.body).hasClass("dropping");
    setDroppingPin(dropping);

    if (dropping) {
      // When the map is clicked, drop a new marker
      mapClickListener = google.maps.event.addListenerOnce(map_, "click", function (event) {
        setDroppingPin(false);

        // Remove the marker that is currently being editied (if it exists)
        if (marker_) {
          marker_.setMap(null);
        }

        // Create a marker on the map
        marker_ = new google.maps.Marker({
          position: event.latLng,
          map: map_,
          animation: google.maps.Animation.DROP
        });

        // Display an info window above the marker
        info_ = new google.maps.InfoWindow({
          content: Template.addPosition()
        });
        info_.open(map_, marker_);

        // If the window is closed with the close button, remove
        // the marker from the map
        google.maps.event.addListener(info_, "closeclick", function () {
          marker_.setMap(null);
        });
      });
    } else {
      google.maps.event.removeListener(mapClickListener);
    }
  }

});
