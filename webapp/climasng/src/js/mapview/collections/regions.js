(function() {
  var Region, Regions;

  Region = require('../models/region');

  Regions = Backbone.Collection.extend({
    model: Region
  });

  module.exports = Regions;

}).call(this);