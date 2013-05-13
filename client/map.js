// TODO use meteor events instead of jquery
// TODO remove autopublish package
// TODO google analytics

Locations = new Meteor.Collection("locations");

var map_;          // the google map on the page
var marker_;       // the google maps marker that is currently focused
var info_;         // the google maps info window that is currently focused
var markers_ = {}; // map from document ID to marker on the map

Meteor.startup(function () {
  var body = $(document.body);

  // Submit the name when the submit button is pressed or the
  // user hits enter inside the text box on the info form
  body.on("click", ".info .btn", function () {
    var name = $(this).siblings(".name").val();
    submitName(name);
    info_.close();
  });
  body.on("keydown", ".info .name", function (event) {
    if (event.keyCode === 13) {
      var name = $(this).val();
      submitName(name);
      info_.close();
    }
  });

  body.on("click", ".btn-delete", function () {
    if (confirm("Are you sure you want to delete this marker?")) {
      var id = $(this).data("id");
      Locations.update(id, { $set: { deleted: true } });
    }
  });

  // Toggle the submit button's enabled-ness as the value in the
  // text box changes
  body.on("input", ".info .name", function () {
    var name = $(this).val();
    var enabled = Boolean(validateName(name));
    $(this).closest(".info").find(".btn").toggleClass("disabled", ! enabled);
  });

  initializeMap();

  // Observe changes to the array of locations on the server, adding and removing
  // markers as necessary
  Locations.find({ deleted: false }).observeChanges({
    added: function (id, location) {
      var position = new google.maps.LatLng(location.lat, location.lng);
      if (! marker_ || ! marker_.getPosition().equals(position)) {
        // Create the marker
        var marker = addMarkerToMap(position);
        markers_[id] = marker;

        // Attach an info window to the marker, mapping the info window to
        // the location ID
        location.id = id;
        attachInfoWindowToMarker(marker, location);
      }
    },

    removed: function (id) {
      var marker = markers_[id];
      if (marker) {
        marker.setMap(null);
        delete markers_[id];
      }
    }
  });
});

/**
 * Ensures a name is valid.
 *
 * @param  {string} name name to validate
 * @return the valid name, or false if the name is invalid
 */
function validateName(name) {
  name = $.trim(name);
  if (name.length > 0) {
    return name;
  }
  return false;
}

/**
 * Adds a marker to the map at a given position.
 *
 * @param {google.maps.LatLng} position position to place the marker
 * @returns {google.maps.Marker} the new marker
 */
function addMarkerToMap(position) {
  var marker = new google.maps.Marker({
    position: position,
    map: map_,
    animation: google.maps.Animation.DROP
  });
  return marker;
}

/**
 * Displays an info window when a marker is clicked.
 *
 * @param {google.maps.Marker} marker   marker to attach the window to
 * @param {Object}             content  content object for the info window. Needs a
 *                                      name field and an id field
 *
 * @return {google.maps.InfoWindow}  the new info window
 */
function attachInfoWindowToMarker(marker, content) {
  var info = new google.maps.InfoWindow({
    content: Template.showPosition(content)
  });
  google.maps.event.addListener(marker, "click", function () {
    info.open(map_, marker);
  });
  return info;
}

/**
 * Inserts a new record into the database using the focused marker
 * as the location and the given name.
 *
 * @param  {string} name name to store in the database
 */
function submitName(name) {
  name = validateName(name);
  if (name) {
    // Insert the record into the database
    var position = marker_.getPosition();
    var id = Locations.insert({
      lat: position.lat(),
      lng: position.lng(),
      name: name,
      deleted: false
    });
    attachInfoWindowToMarker(marker_, { id: id, name: name });

    // Map the database ID to the marker
    markers_[id] = marker_;
    marker_ = null;
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

/**
 * Sets all UI elements according to dropping mode.
 *
 * @param {Boolean} dropping  dropping mode
 */
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
        marker_ = addMarkerToMap(event.latLng);

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
