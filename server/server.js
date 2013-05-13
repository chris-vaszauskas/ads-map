Locations = new Meteor.Collection("locations");

Locations.allow({

  insert: function () {
    return true;
  },

  update: function (userId, doc, fieldNames, modifier) {
    if (fieldNames.length === 1 && fieldNames[0] === "deleted") {
      return true;
    }
  },

});

Meteor.publish("locations", function () {
  return Locations.find({ deleted: false });
});
