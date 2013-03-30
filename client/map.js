Meteor.startup(function () {
  initializeMap();

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
});

function submitName(infoSelector) {
  var name = $.trim(infoSelector.find('.name').val());
  if (name.length > 0) {
    alert('submit name ' + name);
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
      // Create a marker on the map
      var marker = new google.maps.Marker({
        position: event.latLng,
        map: map,
        animation: google.maps.Animation.DROP,
        title: 'Chris'
      });

      // Display an info window above the marker
      var info = new google.maps.InfoWindow({
        content: Template.infoWindow()
      });
      info.open(map, marker);

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
