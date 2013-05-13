Locations = new Meteor.Collection("locations");

Locations.allow({
  insert: function () {
    return true;
  }
});

Meteor.publish("locations", function () {
  return Locations.find({ deleted: false });
});
