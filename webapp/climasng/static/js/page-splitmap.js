(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

require('./mapview/main');
require('./menusandpanels');

$(function() {
    // $('header').disableSelection(); // unpopular but still better
    $('nav > ul').mspp({});
});

},{"./mapview/main":2,"./menusandpanels":6}],2:[function(require,module,exports){
(function() {
  var AppView;

  if (!window.console) {
    window.console = {
      log: function() {
        return {};
      }
    };
  }

  AppView = require('./views/app');

  $(function() {
    var appview;
    appview = new AppView();
    return appview.render();
  });

}).call(this);

},{"./views/app":5}],3:[function(require,module,exports){
(function() {
  var MapLayer;

  MapLayer = Backbone.Model.extend({
    constructor: function(shortName, longName, path) {
      this.shortName = shortName;
      this.longName = longName;
      this.path = path;
      return null;
    }
  });

  module.exports = MapLayer;

}).call(this);

},{}],4:[function(require,module,exports){
(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fn, scope) {
      var i, _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(__indexOf.call(this, i) >= 0 ? fn.call(scope, this[i], i, this) : void 0);
      }
      return _results;
    };
  }

  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(needle) {
      var i, _i, _ref;
      for (i = _i = 0, _ref = this.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (this[i] === needle) {
          return i;
        }
      }
      return -1;
    };
  }

}).call(this);

},{}],5:[function(require,module,exports){
(function() {
  var AppView, MapLayer, debug,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  MapLayer = require('../models/maplayer');

  require('../util/shims');


  /* jshint -W093 */

  debug = function(itemToLog, itemLevel) {
    var levels, messageNum, threshold, thresholdNum;
    levels = ['verydebug', 'debug', 'message', 'warning'];
    threshold = 'message';
    if (!itemLevel) {
      itemLevel = 'debug';
    }
    thresholdNum = levels.indexOf(threshold);
    messageNum = levels.indexOf(itemLevel);
    if (thresholdNum > messageNum) {
      return;
    }
    if (itemToLog + '' === itemToLog) {
      return console.log("[" + itemLevel + "] " + itemToLog);
    } else {
      return console.log(itemToLog);
    }
  };

  AppView = Backbone.View.extend({
    tagName: 'div',
    className: 'splitmap showforms',
    id: 'splitmap',
    speciesDataUrl: window.mapConfig.speciesDataUrl,
    rasterApiUrl: window.mapConfig.rasterApiUrl,
    trackSplitter: false,
    trackPeriod: 100,
    events: {
      'click .btn-change': 'toggleForms',
      'click .btn-compare': 'toggleSplitter',
      'click .btn-copy-ltr': 'copyMapLeftToRight',
      'click .btn-copy-rtl': 'copyMapRightToLeft',
      'leftmapupdate': 'leftSideUpdate',
      'rightmapupdate': 'rightSideUpdate',
      'change select.left': 'leftSideUpdate',
      'change select.right': 'rightSideUpdate'
    },
    tick: function() {
      if (false) {
        debug(this.map.getPixelOrigin());
      }
      return setTimeout(this.tick, 2000);
    },
    initialize: function() {
      debug('AppView.initialize');
      _.bindAll.apply(_, [this].concat(_.functions(this)));
      return this.speciesInfoFetchProcess = this.fetchSpeciesInfo();
    },
    render: function() {
      debug('AppView.render');
      this.$el.append(AppView.templates.layout({
        leftTag: AppView.templates.leftTag(),
        rightTag: AppView.templates.rightTag(),
        leftForm: AppView.templates.leftForm(),
        rightForm: AppView.templates.rightForm()
      }));
      $('#contentwrap').append(this.$el);
      this.map = L.map('map', {
        center: [-20, 136],
        zoom: 5
      });
      this.map.on('move', this.resizeThings);
      L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
        subdomains: '1234',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>,\ntiles &copy; <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>'
      }).addTo(this.map);
      this.leftForm = this.$('.left.form');
      this.buildLeftForm();
      this.rightForm = this.$('.right.form');
      this.buildRightForm();
      this.leftTag = this.$('.left.tag');
      this.rightTag = this.$('.right.tag');
      this.splitLine = this.$('.splitline');
      return this.splitThumb = this.$('.splitthumb');
    },
    resolvePlaceholders: function(strWithPlaceholders, replacements) {
      var ans, key, re, value;
      ans = strWithPlaceholders;
      ans = ans.replace(/\{\{\s*location.protocol\s*\}\}/g, location.protocol);
      ans = ans.replace(/\{\{\s*location.host\s*\}\}/g, location.host);
      ans = ans.replace(/\{\{\s*location.hostname\s*\}\}/g, location.hostname);
      for (key in replacements) {
        value = replacements[key];
        re = new RegExp("\\{\\{\\s*" + key + "\\s*\\}\\}", "g");
        ans = ans.replace(re, value);
      }
      return ans;
    },
    copyMapLeftToRight: function() {
      debug('AppView.copyMapLeftToRight');
      if (!this.leftInfo) {
        return;
      }
      this.$('#rightmapspp').val(this.leftInfo.speciesName);
      this.$('#rightmapyear').val(this.leftInfo.year);
      this.$('#rightmapscenario').val(this.leftInfo.scenario);
      this.$('#rightmapgcm').val(this.leftInfo.gcm);
      return this.rightSideUpdate();
    },
    copyMapRightToLeft: function() {
      debug('AppView.copyMapRightToLeft');
      if (!this.rightInfo) {
        return;
      }
      this.$('#leftmapspp').val(this.rightInfo.speciesName);
      this.$('#leftmapyear').val(this.rightInfo.year);
      this.$('#leftmapscenario').val(this.rightInfo.scenario);
      this.$('#leftmapgcm').val(this.rightInfo.gcm);
      return this.leftSideUpdate();
    },
    leftSideUpdate: function() {
      var newLeftInfo, sppName;
      debug('AppView.leftSideUpdate');
      sppName = this.$('#leftmapspp').val();
      if (__indexOf.call(this.speciesSciNameList, sppName) >= 0) {
        this.$('.btn-copy-rtl').prop('disabled', false);
      } else {
        this.$('.btn-copy-rtl').prop('disabled', true);
        return false;
      }
      newLeftInfo = {
        speciesName: sppName,
        year: this.$('#leftmapyear').val(),
        scenario: this.$('#leftmapscenario').val(),
        gcm: this.$('#leftmapgcm').val()
      };
      if (this.leftInfo && _.isEqual(newLeftInfo, this.leftInfo)) {
        return false;
      }
      if (this.leftInfo && newLeftInfo.speciesName === this.leftInfo.speciesName && newLeftInfo.year === this.leftInfo.year && newLeftInfo.year === 'baseline') {
        return false;
      }
      this.leftInfo = newLeftInfo;
      this.addMapLayer('left');
      return this.addMapTag('left');
    },
    rightSideUpdate: function() {
      var newRightInfo, sppName;
      debug('AppView.rightSideUpdate');
      sppName = this.$('#rightmapspp').val();
      if (__indexOf.call(this.speciesSciNameList, sppName) >= 0) {
        this.$('.btn-copy-ltr').prop('disabled', false);
      } else {
        this.$('.btn-copy-ltr').prop('disabled', true);
        return false;
      }
      newRightInfo = {
        speciesName: sppName,
        year: this.$('#rightmapyear').val(),
        scenario: this.$('#rightmapscenario').val(),
        gcm: this.$('#rightmapgcm').val()
      };
      if (this.rightInfo && _.isEqual(newRightInfo, this.rightInfo)) {
        return false;
      }
      if (this.rightInfo && newRightInfo.speciesName === this.rightInfo.speciesName && newRightInfo.year === this.rightInfo.year && newRightInfo.year === 'baseline') {
        return false;
      }
      this.rightInfo = newRightInfo;
      this.addMapLayer('right');
      return this.addMapTag('right');
    },
    addMapTag: function(side) {
      var info, tag;
      debug('AppView.addMapTag');
      if (side === 'left') {
        info = this.leftInfo;
      }
      if (side === 'right') {
        info = this.rightInfo;
      }
      tag = "<b><i>" + info.speciesName + "</i></b>";
      if (info.year === 'baseline') {
        tag = "current " + tag + " distribution";
      } else if (info.gcm === 'all') {
        tag = "<b>median</b> projections for " + tag + " in <b>" + info.year + "</b> if <b>" + info.scenario + "</b>";
      } else {
        tag = "<b>" + info.gcm + "</b> projections for " + tag + " in <b>" + info.year + "</b> if <b>" + info.scenario + "</b>";
      }
      if (side === 'left') {
        this.leftTag.find('.leftlayername').html(tag);
      }
      if (side === 'right') {
        return this.rightTag.find('.rightlayername').html(tag);
      }
    },
    addMapLayer: function(side) {
      var futureModelPoint, layer, loadClass, mapData, sideInfo;
      debug('AppView.addMapLayer');
      if (side === 'left') {
        sideInfo = this.leftInfo;
      }
      if (side === 'right') {
        sideInfo = this.rightInfo;
      }
      futureModelPoint = [sideInfo.scenario, sideInfo.gcm, sideInfo.year].join('_');
      if (sideInfo.year === 'baseline') {
        futureModelPoint = '1990';
      }
      mapData = [this.resolvePlaceholders(this.speciesDataUrl), sideInfo.speciesName.replace(' ', '_'), 'output', futureModelPoint + '.asc.gz'].join('/');
      layer = L.tileLayer.wms(this.resolvePlaceholders(this.rasterApiUrl), {
        DATA_URL: mapData,
        layers: 'DEFAULT',
        format: 'image/png',
        transparent: true
      });
      loadClass = '' + side + 'loading';
      layer.on('loading', (function(_this) {
        return function() {
          return _this.$el.addClass(loadClass);
        };
      })(this));
      layer.on('load', (function(_this) {
        return function() {
          return _this.$el.removeClass(loadClass);
        };
      })(this));
      layer.addTo(this.map);
      if (side === 'left') {
        if (this.leftLayer) {
          this.map.removeLayer(this.leftLayer);
        }
        this.leftLayer = layer;
      }
      if (side === 'right') {
        if (this.rightLayer) {
          this.map.removeLayer(this.rightLayer);
        }
        this.rightLayer = layer;
      }
      return this.resizeThings();
    },
    centreMap: function(repeatedlyFor) {
      var later, recentre, _i, _results;
      debug('AppView.centreMap');
      if (!repeatedlyFor) {
        repeatedlyFor = 500;
      }
      recentre = (function(_this) {
        return function() {
          _this.map.invalidateSize(false);
          return _this.resizeThings();
        };
      })(this);
      _results = [];
      for (later = _i = 0; _i <= repeatedlyFor; later = _i += 25) {
        _results.push(setTimeout(recentre, later));
      }
      return _results;
    },
    toggleForms: function() {
      debug('AppView.toggleForms');
      this.$el.toggleClass('showforms');
      return this.centreMap();
    },
    toggleSplitter: function() {
      debug('AppView.toggleSplitter');
      this.$el.toggleClass('split');
      if (this.$el.hasClass('split')) {
        this.activateSplitter();
      } else {
        this.deactivateSplitter();
      }
      return this.centreMap();
    },
    fetchSpeciesInfo: function() {
      debug('AppView.fetchSpeciesInfo');
      return $.ajax({
        url: '/speciesdata/species.json',
        dataType: 'json'
      }).done((function(_this) {
        return function(data) {
          var commonNameWriter, speciesLookupList, speciesSciNameList;
          speciesLookupList = [];
          speciesSciNameList = [];
          commonNameWriter = function(sciName) {
            var sciNamePostfix;
            sciNamePostfix = " (" + sciName + ")";
            return function(cnIndex, cn) {
              return speciesLookupList.push({
                label: cn + sciNamePostfix,
                value: sciName
              });
            };
          };
          $.each(data, function(sciName, commonNames) {
            speciesSciNameList.push(sciName);
            if (commonNames) {
              return $.each(commonNames, commonNameWriter(sciName));
            } else {
              return speciesLookupList.push({
                label: sciName,
                value: sciName
              });
            }
          });
          _this.speciesLookupList = speciesLookupList;
          return _this.speciesSciNameList = speciesSciNameList;
        };
      })(this));
    },
    buildLeftForm: function() {
      debug('AppView.buildLeftForm');
      return this.speciesInfoFetchProcess.done((function(_this) {
        return function() {
          var $leftmapspp;
          $leftmapspp = _this.$('#leftmapspp');
          return $leftmapspp.autocomplete({
            source: _this.speciesLookupList,
            appendTo: _this.$el,
            close: function() {
              return _this.$el.trigger('leftmapupdate');
            }
          });
        };
      })(this));
    },
    buildRightForm: function() {
      debug('AppView.buildRightForm');
      return this.speciesInfoFetchProcess.done((function(_this) {
        return function() {
          var $rightmapspp;
          $rightmapspp = _this.$('#rightmapspp');
          return $rightmapspp.autocomplete({
            source: _this.speciesLookupList,
            appendTo: _this.$el,
            close: function() {
              return _this.$el.trigger('rightmapupdate');
            }
          });
        };
      })(this));
    },
    startSplitterTracking: function() {
      debug('AppView.startSplitterTracking');
      this.trackSplitter = true;
      this.splitLine.addClass('dragging');
      return this.locateSplitter();
    },
    locateSplitter: function() {
      debug('AppView.locateSplitter');
      if (this.trackSplitter) {
        this.resizeThings();
        if (this.trackSplitter === 0) {
          this.trackSplitter = false;
        } else if (this.trackSplitter !== true) {
          this.trackSplitter -= 1;
        }
        return setTimeout(this.locateSplitter, this.trackPeriod);
      }
    },
    resizeThings: function() {
      var $mapBox, bottomRight, layerBottom, layerTop, leftLeft, leftMap, mapBounds, mapBox, newLeftWidth, rightMap, rightRight, splitPoint, splitX, topLeft;
      debug('AppView.resizeThings');
      if (this.leftLayer) {
        leftMap = $(this.leftLayer.getContainer());
      }
      if (this.rightLayer) {
        rightMap = $(this.rightLayer.getContainer());
      }
      if (this.$el.hasClass('split')) {
        newLeftWidth = this.splitThumb.position().left + (this.splitThumb.width() / 2.0);
        mapBox = this.map.getContainer();
        $mapBox = $(mapBox);
        mapBounds = mapBox.getBoundingClientRect();
        topLeft = this.map.containerPointToLayerPoint([0, 0]);
        splitPoint = this.map.containerPointToLayerPoint([newLeftWidth, 0]);
        bottomRight = this.map.containerPointToLayerPoint([$mapBox.width(), $mapBox.height()]);
        layerTop = topLeft.y;
        layerBottom = bottomRight.y;
        splitX = splitPoint.x - mapBounds.left;
        leftLeft = topLeft.x - mapBounds.left;
        rightRight = bottomRight.x;
        this.splitLine.css('left', newLeftWidth);
        this.leftTag.attr('style', "clip: rect(0, " + newLeftWidth + "px, auto, 0)");
        if (this.leftLayer) {
          leftMap.attr('style', "clip: rect(" + layerTop + "px, " + splitX + "px, " + layerBottom + "px, " + leftLeft + "px)");
        }
        if (this.rightLayer) {
          return rightMap.attr('style', "clip: rect(" + layerTop + "px, " + rightRight + "px, " + layerBottom + "px, " + splitX + "px)");
        }
      } else {
        this.leftTag.attr('style', 'clip: inherit');
        if (this.leftLayer) {
          leftMap.attr('style', 'clip: inherit');
        }
        if (this.rightLayer) {
          return rightMap.attr('style', 'clip: rect(0,0,0,0)');
        }
      }
    },
    stopSplitterTracking: function() {
      debug('AppView.stopSplitterTracking');
      this.splitLine.removeClass('dragging');
      return this.trackSplitter = 5;
    },
    activateSplitter: function() {
      debug('AppView.activateSplitter');
      this.splitThumb.draggable({
        containment: $('#mapwrapper'),
        scroll: false,
        start: this.startSplitterTracking,
        drag: this.resizeThings,
        stop: this.stopSplitterTracking
      });
      return this.resizeThings();
    },
    deactivateSplitter: function() {
      debug('AppView.deactivateSplitter');
      this.splitThumb.draggable('destroy');
      return this.resizeThings();
    }
  }, {
    templates: {
      layout: _.template("<div class=\"splitline\">&nbsp;</div>\n<div class=\"splitthumb\"><span>&#x276e; &#x276f;</span></div>\n<div class=\"left tag\"><%= leftTag %></div>\n<div class=\"right tag\"><%= rightTag %></div>\n<div class=\"left side form\"><%= leftForm %></div>\n<div class=\"right side form\"><%= rightForm %></div>\n<div class=\"left loader\"><img src=\"/static/images/spinner.loadinfo.net.gif\" /></div>\n<div class=\"right loader\"><img src=\"/static/images/spinner.loadinfo.net.gif\" /></div>\n<div id=\"mapwrapper\"><div id=\"map\"></div></div>"),
      leftTag: _.template("<div class=\"show\">\n    <span class=\"leftlayername\">plain map</span>\n    <br>\n    <button class=\"btn-change\">settings</button>\n    <button class=\"btn-compare\">show/hide comparison map</button>\n</div>\n<div class=\"edit\">\n    <input id=\"leftmapspp\" name=\"leftmapspp\" placeholder=\"&hellip; species or group &hellip;\" />\n    <!--\n    <button class=\"btn-change\">hide settings</button>\n    <button class=\"btn-compare\">compare +/-</button>\n    -->\n</div>"),
      rightTag: _.template("<div class=\"show\">\n    <span class=\"rightlayername\">(no distribution)</span>\n    <br>\n    <button class=\"btn-change\">settings</button>\n    <button class=\"btn-compare\">show/hide comparison map</button>\n</div>\n<div class=\"edit\">\n    <input id=\"rightmapspp\" name=\"rightmapspp\" placeholder=\"&hellip; species or group &hellip;\" />\n</div>"),
      leftForm: _.template("<fieldset>\n    <button class=\"btn-copy-rtl\">copy right map &laquo;</button>\n</fieldset>\n<fieldset>\n    <legend>time point</legend>\n    <select class=\"left\" id=\"leftmapyear\">\n        <option value=\"baseline\">current</option>\n        <option>2015</option>\n        <option>2025</option>\n        <option>2035</option>\n        <option>2045</option>\n        <option>2055</option>\n        <option>2065</option>\n        <option>2075</option>\n        <option>2085</option>\n    </select>\n</fieldset>\n<fieldset>\n    <legend>emission scenario</legend>\n    <label><span>RCP 4.5</span> <input name=\"leftmapscenario\" type=\"radio\" value=\"RCP45\"> lower emissions</label>\n    <label><span>RCP 8.5</span> <input name=\"leftmapscenario\" type=\"radio\" value=\"RCP85\" checked=\"checked\"> business as usual</label>\n</fieldset>\n<fieldset>\n    <legend>model summary</legend>\n    <select class=\"left\" id=\"leftmapgcm\">\n        <option value=\"10th\">10th percentile</option>\n        <option value=\"all\" selected=\"selected\">50th percentile</option>\n        <option value=\"90th\">90th percentile</option>\n    </select>\n</fieldset><fieldset>\n    <legend></legend>\n    <button class=\"btn-change\">hide settings</button>\n</fieldset><fieldset>\n    <button class=\"btn-compare\">compare +/-</button>\n</fieldset>"),
      rightForm: _.template("<fieldset>\n<button class=\"btn-copy-ltr\">&raquo; copy left map</button>\n</fieldset><fieldset>\n<select class=\"right\" id=\"rightmapyear\">\n    <option value=\"baseline\">baseline</option>\n    <option>2015</option>\n    <option>2025</option>\n    <option>2035</option>\n    <option>2045</option>\n    <option>2055</option>\n    <option>2065</option>\n    <option>2075</option>\n    <option>2085</option>\n</select>\n</fieldset><fieldset>\n<select class=\"right\" id=\"rightmapscenario\">\n    <option value=\"RCP3PD\">RCP 3PD</option>\n    <option value=\"RCP45\">RCP 4.5</option>\n    <option value=\"RCP6\">RCP 6</option>\n    <option value=\"RCP85\" selected=\"selected\">RCP 8.5</option>\n</select>\n</fieldset><fieldset>\n<select class=\"right\" id=\"rightmapgcm\">\n    <option value=\"10th\">10th percentile</option>\n    <option value=\"all\" selected=\"selected\">50th percentile</option>\n    <option value=\"90th\">90th percentile</option>\n</select>\n</fieldset><fieldset>\n<legend></legend>\n<button class=\"btn-change\">hide settings</button>\n</fieldset><fieldset>\n<button class=\"btn-compare\">compare +/-</button>\n</fieldset>")
    }
  });

  module.exports = AppView;

}).call(this);

},{"../models/maplayer":3,"../util/shims":4}],6:[function(require,module,exports){

// jQuery plugin
// author: Daniel Baird <daniel@danielbaird.com>
// version: 0.1.20140205

//
// This manages menus, submenus, panels, and pages.
// Like this:
// ---.--------------------------------------------------------.----------------------.------------------------.---
//    |                                                        |                      |                        |
//    |  Selected Main Menu Item   .-----------. .---------.   |  Alt Main Menu Item  |  Third Main Menu Item  |
//    |                           /  Subitem 1  \ Subitem 2 \  |                      |                        |
// ---'--------------------------'               '-------------'----------------------'------------------------'---
//       |                                                                                                 |
//       |   Panel for Subitem 1, this is Page 1                                                           |
//       |                                                                                                 |
//       |   Each Panel can have multiple pages, one page showing at a time.  Buttons on pages switch      |
//       |   between pages.  Panel height adjusts to the height of the page.                               |
//       |                                                                                                 |
//       |   [ see page 2 ]                                                                                |
//       |                                                                                                 |
//       '-------------------------------------------------------------------------------------------------'
//
// - menus are always <ul> tags; each <li> is a menu item
// - a main menu <li> must contain an <a> tag and may also contain a <ul> submenu
// - a submenu <li> must contain an <a> tag with a data-targetpanel attribute set
// - There is always a single selected main menu item
// - A main menu item may either link to another webpage, or have a submenu
// - Selecting a main menu item will show its submenu, if it has one
// - A submenu always has a single item selected
// - Clicking an inactive submenu item will show its panel
// - Clicking a selected submenu item will toggle its panel showing <-> hiding ((( NB: not yet implemented )))
// - A panel initially shows its first page
// - Switching pages in a panel changes the panel height to suit its current page
// - A panel is a HTML block element with the class .mspp-panel (can be overridden via option)
// - If a panel contains pages, one page should have the class .current (can be overridden via option)
// - A page is a HTML block element with the class .mspp-page (can be overridden via option)
// - <button> or <a> tags in pages that have a data-targetpage attribute set will switch to the indicated page
//
//
// The HTML should look like this:
//
//  <ul class="menu">                   <!-- this is the main menu -->
//      <li class="current">            <!-- this is a main menu item, currently selected -->
//          <a>First Item</a>           <!-- the first item in the main menu -->
//          <ul>                        <!-- a submenu in the first main menu item -->
//              <li class="current">    <!-- the currently selected submenu item -->
//                                      <!-- .paneltrigger and the data-panelid attribute are required -->
//                  <a data-targetpanel="panel1">do the panel1 thing</a>
//              </li>
//              <li>...</li>            <!-- another submenu item -->
//          </ul>
//      </li>
//      <li> <a href="another_page.html">another page</a> </li>
//      <li> <a>whatever</a> </li>
//  </ul>
//
//  <div id="panel1" class="mspp-panel">
//      <div id="page11" class="mspp-page current">
//          This is the current page on panel 1.
//          <button type="button" data-targetpage="page12">show page 2</button>
//      </div>
//      <div id="page12" class="mspp-page">
//          This is the other page on panel 1.
//          <a data-targetpage="page11">see the first page again</a>
//      </div>
//  </div>
//  <div id="panel2" class="mspp-panel">
//      <div id="page21" class="mspp-page current">
//          This is the current page on panel 2.
//          <button type="button" data-targetpage="page22">show page 2</button>
//      </div>
//      <div id="page22" class="mspp-page">
//          This is the other page on panel 2.
//          <a data-targetpage="page21">see the first page again</a>
//      </div>
//  </div>


;( function($, window, document, undefined) {

    // namespace climas, widget name mspp
    // second arg is used as the widget's "prototype" object
    $.widget( "climas.mspp" , {

        //Options to be used as defaults
        options: {
            animationFactor: 2,

            mainMenuClass: 'mspp-main-menu',

            panelClass: 'mspp-panel',
            pageClass: 'mspp-page',

            clearfixClass: 'mspp-clearfix',
            activeClass: 'current'
        },
        // ----------------------------------------------------------
        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function() {

            var base = this;
            var opts = this.options;

            // populate some convenience variables
            var $menu = this.element;
            this.mainMenuItems = $menu.children('li');
            this.panels = $('.' + opts.panelClass);

            // disappear while we sort things out
            $menu.css({ opacity: 0 });
            this.panels.css({ opacity: 0 });

            // make some DOM mods
            $menu.addClass(opts.mainMenuClass);
            $menu.addClass(opts.clearfixClass);
            this.panels.addClass(opts.clearfixClass);

            // layout the menu
            this._layoutMenu();

            // layout the panels
            this._layoutPanels();

            // hook up click handling etc
            $menu.on('msppshowmenu', this._showMenu);
            $menu.on('msppshowsubmenu', this._showSubMenu);
            $menu.on('msppshowpanel', this._showPanel);
            $menu.on('msppshowpage', this._showPage);

            // attach handlers to the menu-triggers
            this.mainMenuItems.each( function(index, item) {
                // the li menu item has a child a that is it's trigger
                $(item).children('a').click( function(event) {
                    base._trigger('showmenu', event, {
                        menuitem: item,
                        widget: base
                    });
                });
                // attach handlers to the submenu items
                $(item).find('li').each( function(index, subMenuItem) {
                    $(subMenuItem).find('a').click( function(event) {
                        base._trigger('showsubmenu', event, {
                            menuitem: item,
                            submenuitem: subMenuItem,
                            widget: base
                        });
                    });
                });
            });

            // attach handlers to the panel triggers
            $menu.find('[data-targetpanel]').each( function(index, trigger) {
                var $trigger =$(trigger);
                $trigger.click( function(event) {
                    base._trigger('showpanel', event, {
                        panel: $('#' + $trigger.data('targetpanel')).first(),
                        widget: base
                    });
                });
            });

            // attach handlers to the page switchers
            this.panels.each( function(index, panel) {
                var $panel = $(panel);
                $panel.find('[data-targetpage]').click( function(event) {
                    base._trigger('showpage', event, {
                        panel: $panel,
                        page: $('#' + $(this).data('targetpage')),
                        widget: base
                    });
                });
            });

            // activate the current menus, panels etc
            var $currentMain = this.mainMenuItems.filter('.' + opts.activeClass);
            $currentMain.removeClass(opts.activeClass).children('a').click();

            // finally, fade back in
            $menu.animate({ opacity: 1 }, 'fast');

            // panels stay invisible
        },
        // ----------------------------------------------------------
        _switchClassOption: function(className, newClass) {
            var oldClass = this.options[className];
            if (oldClass !== newClass) {
                var group = this.element.find('.' + oldClass);
                this.options[className] = newClass;
                group.removeClass(oldClass);
                group.addClass(newClass);
            }
        },
        // ----------------------------------------------------------
        // Respond to any changes the user makes to the
        // option method
        _setOption: function(key, value) {
            switch (key) {
                case "mainMenuClass":
                case "clearfixClass":
                case "activeClass":
                    this._switchClassOption(key, value);
                    break;

                default:
                    this.options[key] = value;
                    break;
                // it's okay that there's no } here
            }
            // remember to call our super's _setOption method
            this._super( "_setOption", key, value );
        },
        // ----------------------------------------------------------
        // Destroy an instantiated plugin and clean up
        // modifications the widget has made to the DOM
        _destroy: function() {
            this.element.removeClass(this.options.mainMenuClass);
            this.element.removeClass(this.options.clearfixClass);
            this.panels.removeClass(this.options.clearfixClass);
        },
        // ----------------------------------------------------------
        // do the layout calculations
        _layoutMenu: function() {
            // go through each submenu and record its width
            this.element.find('ul').each( function(index, subMenu) {
                var $sm = $(subMenu);
                $sm.css({width: 'auto'});
                $sm.data('originalWidth', $sm.width());

                // leave each submenu hidden, with width 0
                $sm.css({ width: 0, display: 'none' });
            });
        },
        // ----------------------------------------------------------
        _showMenu: function(event, data) {
            var $item = $(data.menuitem);
            var base = data.widget;
            // $item is a clicked-on menu item..
            if ($item.hasClass(base.options.activeClass)) {
                // ??
            } else {
                base._hidePanels();
                base.mainMenuItems.removeClass(base.options.activeClass);
                var $newSubMenu = $item.find('ul');
                var $oldSubMenus = base.element.find('ul').not($newSubMenu);
                var newWidth = $newSubMenu.data('originalWidth');

                $oldSubMenus.animate({ width: 0 }, (50 * base.options.animationFactor), function() {
                    $oldSubMenus.css({ display: 'none' });
                });
                $item.addClass(base.options.activeClass);
                $newSubMenu
                    .css({display: 'block' })
                    .animate({ width: newWidth }, (125 * base.options.animationFactor), function() {
                        $newSubMenu.css({ width: 'auto' }).removeAttr('style');
                        base._trigger('menushown', event, { item: $item, widget: base });
                    })
                ;
                // if the new submenu has an active item, click it
                $newSubMenu.find('.' + base.options.activeClass + ' a').click();
            }
        },
        // ----------------------------------------------------------
        _showSubMenu: function(event, data) {
            // de-activeify all the submenu items
            $(data.menuitem).find('li').removeClass(data.widget.options.activeClass);
            // active-ify the one true submenu item
            $(data.submenuitem).addClass(data.widget.options.activeClass);
        },
        // ----------------------------------------------------------
        // do the layout calculations
        _layoutPanels: function() {

            var $pages = this.panels.find('.' + this.options.pageClass);

            // go through each page and record its height
            $pages.each( function(index, page) {
                var $page = $(page);
                $page.css({height: 'auto'});
                $page.data('originalHeight', $page.outerHeight());

                // leave each page hidden, with height 0
                $page.css({ height: 0, display: 'none' });
            });

            // go through each panel and hide it
            this.panels.each( function(index, panel) {
                var $panel = $(panel);
                $panel.css({ display: 'none' });
            });
        },
        // ----------------------------------------------------------
        _hidePanels: function() {
            this.panels.removeClass(this.options.activeClass).css({ display: 'none', height: 0 });
        },
        // ----------------------------------------------------------
        _showPanel: function(event, data) {
            var $panel = $(data.panel);
            var base = data.widget;
            // $panel is a panel to show..
            if ($panel.hasClass(base.options.activeClass)) {
                // ??
            } else {
                base._hidePanels();
                $panel.addClass(base.options.activeClass);
                $panel.css({ display: 'block', opacity: 1 });
                var $page = $($panel.find('.' + base.options.pageClass + '.' + base.options.activeClass));
                base._trigger('showpage', event, { panel: $panel, page: $page, widget: base });
            }
        },
        // ----------------------------------------------------------
        _showPage: function(event, data) {
            var base = data.widget;
            var $panel = $(data.panel);
            var $page = $(data.page);
            var newHeight = $page.data('originalHeight');

            // fix the panel's current height
            $panel.css({height: $panel.height() });

            // deal with the page currently being displayed
            var $oldPage = $panel.find('.' + base.options.pageClass + '.' + base.options.activeClass).not($page);
            if ($oldPage.length > 0) {
                $oldPage.data('originalHeight', $oldPage.outerHeight());
                $oldPage.removeClass(base.options.activeClass).fadeOut((50 * base.options.animationFactor), function() {
                    $oldPage.css({ height: 0 });
                });
            }

            // switch on the new page and grow the opanel to hold it
            $page.css({ height: 'auto' }).addClass(base.options.activeClass).fadeIn((100 * base.options.animationFactor), function() {
                $page.removeAttr('style');
            });
            var animTime = ($oldPage.length > 0 ? (100 * base.options.animationFactor) : (150 * base.options.animationFactor)); // animate faster if it's switching pages
            $panel.animate({ height: newHeight }, animTime, function() {
                $panel.removeAttr('style');
            });

        },
        // ----------------------------------------------------------
        _: null // no following comma
    });

})(jQuery, window, document);













},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wdnJkd2IvamN1L2NuZy93ZWJhcHAvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3B2cmR3Yi9qY3UvY25nL3dlYmFwcC9jbGltYXNuZy9zcmMvanMvZmFrZV9hNGM5MGE0OC5qcyIsIi9Vc2Vycy9wdnJkd2IvamN1L2NuZy93ZWJhcHAvY2xpbWFzbmcvc3JjL2pzL21hcHZpZXcvbWFpbi5qcyIsIi9Vc2Vycy9wdnJkd2IvamN1L2NuZy93ZWJhcHAvY2xpbWFzbmcvc3JjL2pzL21hcHZpZXcvbW9kZWxzL21hcGxheWVyLmpzIiwiL1VzZXJzL3B2cmR3Yi9qY3UvY25nL3dlYmFwcC9jbGltYXNuZy9zcmMvanMvbWFwdmlldy91dGlsL3NoaW1zLmpzIiwiL1VzZXJzL3B2cmR3Yi9qY3UvY25nL3dlYmFwcC9jbGltYXNuZy9zcmMvanMvbWFwdmlldy92aWV3cy9hcHAuanMiLCIvVXNlcnMvcHZyZHdiL2pjdS9jbmcvd2ViYXBwL2NsaW1hc25nL3NyYy9qcy9tZW51c2FuZHBhbmVscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxucmVxdWlyZSgnLi9tYXB2aWV3L21haW4nKTtcbnJlcXVpcmUoJy4vbWVudXNhbmRwYW5lbHMnKTtcblxuJChmdW5jdGlvbigpIHtcbiAgICAvLyAkKCdoZWFkZXInKS5kaXNhYmxlU2VsZWN0aW9uKCk7IC8vIHVucG9wdWxhciBidXQgc3RpbGwgYmV0dGVyXG4gICAgJCgnbmF2ID4gdWwnKS5tc3BwKHt9KTtcbn0pO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgQXBwVmlldztcblxuICBpZiAoIXdpbmRvdy5jb25zb2xlKSB7XG4gICAgd2luZG93LmNvbnNvbGUgPSB7XG4gICAgICBsb2c6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIEFwcFZpZXcgPSByZXF1aXJlKCcuL3ZpZXdzL2FwcCcpO1xuXG4gICQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFwcHZpZXc7XG4gICAgYXBwdmlldyA9IG5ldyBBcHBWaWV3KCk7XG4gICAgcmV0dXJuIGFwcHZpZXcucmVuZGVyKCk7XG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgTWFwTGF5ZXI7XG5cbiAgTWFwTGF5ZXIgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihzaG9ydE5hbWUsIGxvbmdOYW1lLCBwYXRoKSB7XG4gICAgICB0aGlzLnNob3J0TmFtZSA9IHNob3J0TmFtZTtcbiAgICAgIHRoaXMubG9uZ05hbWUgPSBsb25nTmFtZTtcbiAgICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gTWFwTGF5ZXI7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBfX2luZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHsgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykgeyBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpOyB9IHJldHVybiAtMTsgfTtcblxuICBpZiAoIUFycmF5LnByb3RvdHlwZS5mb3JFYWNoKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihmbiwgc2NvcGUpIHtcbiAgICAgIHZhciBpLCBfaSwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChpID0gX2kgPSAwLCBfcmVmID0gdGhpcy5sZW5ndGg7IDAgPD0gX3JlZiA/IF9pIDw9IF9yZWYgOiBfaSA+PSBfcmVmOyBpID0gMCA8PSBfcmVmID8gKytfaSA6IC0tX2kpIHtcbiAgICAgICAgX3Jlc3VsdHMucHVzaChfX2luZGV4T2YuY2FsbCh0aGlzLCBpKSA+PSAwID8gZm4uY2FsbChzY29wZSwgdGhpc1tpXSwgaSwgdGhpcykgOiB2b2lkIDApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH07XG4gIH1cblxuICBpZiAoIUFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbihuZWVkbGUpIHtcbiAgICAgIHZhciBpLCBfaSwgX3JlZjtcbiAgICAgIGZvciAoaSA9IF9pID0gMCwgX3JlZiA9IHRoaXMubGVuZ3RoOyAwIDw9IF9yZWYgPyBfaSA8PSBfcmVmIDogX2kgPj0gX3JlZjsgaSA9IDAgPD0gX3JlZiA/ICsrX2kgOiAtLV9pKSB7XG4gICAgICAgIGlmICh0aGlzW2ldID09PSBuZWVkbGUpIHtcbiAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG4gIH1cblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIEFwcFZpZXcsIE1hcExheWVyLCBkZWJ1ZyxcbiAgICBfX2luZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHsgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykgeyBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpOyB9IHJldHVybiAtMTsgfTtcblxuICBNYXBMYXllciA9IHJlcXVpcmUoJy4uL21vZGVscy9tYXBsYXllcicpO1xuXG4gIHJlcXVpcmUoJy4uL3V0aWwvc2hpbXMnKTtcblxuXG4gIC8qIGpzaGludCAtVzA5MyAqL1xuXG4gIGRlYnVnID0gZnVuY3Rpb24oaXRlbVRvTG9nLCBpdGVtTGV2ZWwpIHtcbiAgICB2YXIgbGV2ZWxzLCBtZXNzYWdlTnVtLCB0aHJlc2hvbGQsIHRocmVzaG9sZE51bTtcbiAgICBsZXZlbHMgPSBbJ3ZlcnlkZWJ1ZycsICdkZWJ1ZycsICdtZXNzYWdlJywgJ3dhcm5pbmcnXTtcbiAgICB0aHJlc2hvbGQgPSAnbWVzc2FnZSc7XG4gICAgaWYgKCFpdGVtTGV2ZWwpIHtcbiAgICAgIGl0ZW1MZXZlbCA9ICdkZWJ1Zyc7XG4gICAgfVxuICAgIHRocmVzaG9sZE51bSA9IGxldmVscy5pbmRleE9mKHRocmVzaG9sZCk7XG4gICAgbWVzc2FnZU51bSA9IGxldmVscy5pbmRleE9mKGl0ZW1MZXZlbCk7XG4gICAgaWYgKHRocmVzaG9sZE51bSA+IG1lc3NhZ2VOdW0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGl0ZW1Ub0xvZyArICcnID09PSBpdGVtVG9Mb2cpIHtcbiAgICAgIHJldHVybiBjb25zb2xlLmxvZyhcIltcIiArIGl0ZW1MZXZlbCArIFwiXSBcIiArIGl0ZW1Ub0xvZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjb25zb2xlLmxvZyhpdGVtVG9Mb2cpO1xuICAgIH1cbiAgfTtcblxuICBBcHBWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIHRhZ05hbWU6ICdkaXYnLFxuICAgIGNsYXNzTmFtZTogJ3NwbGl0bWFwIHNob3dmb3JtcycsXG4gICAgaWQ6ICdzcGxpdG1hcCcsXG4gICAgc3BlY2llc0RhdGFVcmw6IHdpbmRvdy5tYXBDb25maWcuc3BlY2llc0RhdGFVcmwsXG4gICAgcmFzdGVyQXBpVXJsOiB3aW5kb3cubWFwQ29uZmlnLnJhc3RlckFwaVVybCxcbiAgICB0cmFja1NwbGl0dGVyOiBmYWxzZSxcbiAgICB0cmFja1BlcmlvZDogMTAwLFxuICAgIGV2ZW50czoge1xuICAgICAgJ2NsaWNrIC5idG4tY2hhbmdlJzogJ3RvZ2dsZUZvcm1zJyxcbiAgICAgICdjbGljayAuYnRuLWNvbXBhcmUnOiAndG9nZ2xlU3BsaXR0ZXInLFxuICAgICAgJ2NsaWNrIC5idG4tY29weS1sdHInOiAnY29weU1hcExlZnRUb1JpZ2h0JyxcbiAgICAgICdjbGljayAuYnRuLWNvcHktcnRsJzogJ2NvcHlNYXBSaWdodFRvTGVmdCcsXG4gICAgICAnbGVmdG1hcHVwZGF0ZSc6ICdsZWZ0U2lkZVVwZGF0ZScsXG4gICAgICAncmlnaHRtYXB1cGRhdGUnOiAncmlnaHRTaWRlVXBkYXRlJyxcbiAgICAgICdjaGFuZ2Ugc2VsZWN0LmxlZnQnOiAnbGVmdFNpZGVVcGRhdGUnLFxuICAgICAgJ2NoYW5nZSBzZWxlY3QucmlnaHQnOiAncmlnaHRTaWRlVXBkYXRlJ1xuICAgIH0sXG4gICAgdGljazogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoZmFsc2UpIHtcbiAgICAgICAgZGVidWcodGhpcy5tYXAuZ2V0UGl4ZWxPcmlnaW4oKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2V0VGltZW91dCh0aGlzLnRpY2ssIDIwMDApO1xuICAgIH0sXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICBkZWJ1ZygnQXBwVmlldy5pbml0aWFsaXplJyk7XG4gICAgICBfLmJpbmRBbGwuYXBwbHkoXywgW3RoaXNdLmNvbmNhdChfLmZ1bmN0aW9ucyh0aGlzKSkpO1xuICAgICAgcmV0dXJuIHRoaXMuc3BlY2llc0luZm9GZXRjaFByb2Nlc3MgPSB0aGlzLmZldGNoU3BlY2llc0luZm8oKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICBkZWJ1ZygnQXBwVmlldy5yZW5kZXInKTtcbiAgICAgIHRoaXMuJGVsLmFwcGVuZChBcHBWaWV3LnRlbXBsYXRlcy5sYXlvdXQoe1xuICAgICAgICBsZWZ0VGFnOiBBcHBWaWV3LnRlbXBsYXRlcy5sZWZ0VGFnKCksXG4gICAgICAgIHJpZ2h0VGFnOiBBcHBWaWV3LnRlbXBsYXRlcy5yaWdodFRhZygpLFxuICAgICAgICBsZWZ0Rm9ybTogQXBwVmlldy50ZW1wbGF0ZXMubGVmdEZvcm0oKSxcbiAgICAgICAgcmlnaHRGb3JtOiBBcHBWaWV3LnRlbXBsYXRlcy5yaWdodEZvcm0oKVxuICAgICAgfSkpO1xuICAgICAgJCgnI2NvbnRlbnR3cmFwJykuYXBwZW5kKHRoaXMuJGVsKTtcbiAgICAgIHRoaXMubWFwID0gTC5tYXAoJ21hcCcsIHtcbiAgICAgICAgY2VudGVyOiBbLTIwLCAxMzZdLFxuICAgICAgICB6b29tOiA1XG4gICAgICB9KTtcbiAgICAgIHRoaXMubWFwLm9uKCdtb3ZlJywgdGhpcy5yZXNpemVUaGluZ3MpO1xuICAgICAgTC50aWxlTGF5ZXIoJ2h0dHA6Ly9vdGlsZXtzfS5tcWNkbi5jb20vdGlsZXMvMS4wLjAvbWFwL3t6fS97eH0ve3l9LnBuZycsIHtcbiAgICAgICAgc3ViZG9tYWluczogJzEyMzQnLFxuICAgICAgICBtYXhab29tOiAxOCxcbiAgICAgICAgYXR0cmlidXRpb246ICdNYXAgZGF0YSAmY29weTsgPGEgaHJlZj1cImh0dHA6Ly9vcGVuc3RyZWV0bWFwLm9yZ1wiPk9wZW5TdHJlZXRNYXA8L2E+LFxcbnRpbGVzICZjb3B5OyA8YSBocmVmPVwiaHR0cDovL3d3dy5tYXBxdWVzdC5jb20vXCIgdGFyZ2V0PVwiX2JsYW5rXCI+TWFwUXVlc3Q8L2E+J1xuICAgICAgfSkuYWRkVG8odGhpcy5tYXApO1xuICAgICAgdGhpcy5sZWZ0Rm9ybSA9IHRoaXMuJCgnLmxlZnQuZm9ybScpO1xuICAgICAgdGhpcy5idWlsZExlZnRGb3JtKCk7XG4gICAgICB0aGlzLnJpZ2h0Rm9ybSA9IHRoaXMuJCgnLnJpZ2h0LmZvcm0nKTtcbiAgICAgIHRoaXMuYnVpbGRSaWdodEZvcm0oKTtcbiAgICAgIHRoaXMubGVmdFRhZyA9IHRoaXMuJCgnLmxlZnQudGFnJyk7XG4gICAgICB0aGlzLnJpZ2h0VGFnID0gdGhpcy4kKCcucmlnaHQudGFnJyk7XG4gICAgICB0aGlzLnNwbGl0TGluZSA9IHRoaXMuJCgnLnNwbGl0bGluZScpO1xuICAgICAgcmV0dXJuIHRoaXMuc3BsaXRUaHVtYiA9IHRoaXMuJCgnLnNwbGl0dGh1bWInKTtcbiAgICB9LFxuICAgIHJlc29sdmVQbGFjZWhvbGRlcnM6IGZ1bmN0aW9uKHN0cldpdGhQbGFjZWhvbGRlcnMsIHJlcGxhY2VtZW50cykge1xuICAgICAgdmFyIGFucywga2V5LCByZSwgdmFsdWU7XG4gICAgICBhbnMgPSBzdHJXaXRoUGxhY2Vob2xkZXJzO1xuICAgICAgYW5zID0gYW5zLnJlcGxhY2UoL1xce1xce1xccypsb2NhdGlvbi5wcm90b2NvbFxccypcXH1cXH0vZywgbG9jYXRpb24ucHJvdG9jb2wpO1xuICAgICAgYW5zID0gYW5zLnJlcGxhY2UoL1xce1xce1xccypsb2NhdGlvbi5ob3N0XFxzKlxcfVxcfS9nLCBsb2NhdGlvbi5ob3N0KTtcbiAgICAgIGFucyA9IGFucy5yZXBsYWNlKC9cXHtcXHtcXHMqbG9jYXRpb24uaG9zdG5hbWVcXHMqXFx9XFx9L2csIGxvY2F0aW9uLmhvc3RuYW1lKTtcbiAgICAgIGZvciAoa2V5IGluIHJlcGxhY2VtZW50cykge1xuICAgICAgICB2YWx1ZSA9IHJlcGxhY2VtZW50c1trZXldO1xuICAgICAgICByZSA9IG5ldyBSZWdFeHAoXCJcXFxce1xcXFx7XFxcXHMqXCIgKyBrZXkgKyBcIlxcXFxzKlxcXFx9XFxcXH1cIiwgXCJnXCIpO1xuICAgICAgICBhbnMgPSBhbnMucmVwbGFjZShyZSwgdmFsdWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFucztcbiAgICB9LFxuICAgIGNvcHlNYXBMZWZ0VG9SaWdodDogZnVuY3Rpb24oKSB7XG4gICAgICBkZWJ1ZygnQXBwVmlldy5jb3B5TWFwTGVmdFRvUmlnaHQnKTtcbiAgICAgIGlmICghdGhpcy5sZWZ0SW5mbykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLiQoJyNyaWdodG1hcHNwcCcpLnZhbCh0aGlzLmxlZnRJbmZvLnNwZWNpZXNOYW1lKTtcbiAgICAgIHRoaXMuJCgnI3JpZ2h0bWFweWVhcicpLnZhbCh0aGlzLmxlZnRJbmZvLnllYXIpO1xuICAgICAgdGhpcy4kKCcjcmlnaHRtYXBzY2VuYXJpbycpLnZhbCh0aGlzLmxlZnRJbmZvLnNjZW5hcmlvKTtcbiAgICAgIHRoaXMuJCgnI3JpZ2h0bWFwZ2NtJykudmFsKHRoaXMubGVmdEluZm8uZ2NtKTtcbiAgICAgIHJldHVybiB0aGlzLnJpZ2h0U2lkZVVwZGF0ZSgpO1xuICAgIH0sXG4gICAgY29weU1hcFJpZ2h0VG9MZWZ0OiBmdW5jdGlvbigpIHtcbiAgICAgIGRlYnVnKCdBcHBWaWV3LmNvcHlNYXBSaWdodFRvTGVmdCcpO1xuICAgICAgaWYgKCF0aGlzLnJpZ2h0SW5mbykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLiQoJyNsZWZ0bWFwc3BwJykudmFsKHRoaXMucmlnaHRJbmZvLnNwZWNpZXNOYW1lKTtcbiAgICAgIHRoaXMuJCgnI2xlZnRtYXB5ZWFyJykudmFsKHRoaXMucmlnaHRJbmZvLnllYXIpO1xuICAgICAgdGhpcy4kKCcjbGVmdG1hcHNjZW5hcmlvJykudmFsKHRoaXMucmlnaHRJbmZvLnNjZW5hcmlvKTtcbiAgICAgIHRoaXMuJCgnI2xlZnRtYXBnY20nKS52YWwodGhpcy5yaWdodEluZm8uZ2NtKTtcbiAgICAgIHJldHVybiB0aGlzLmxlZnRTaWRlVXBkYXRlKCk7XG4gICAgfSxcbiAgICBsZWZ0U2lkZVVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbmV3TGVmdEluZm8sIHNwcE5hbWU7XG4gICAgICBkZWJ1ZygnQXBwVmlldy5sZWZ0U2lkZVVwZGF0ZScpO1xuICAgICAgc3BwTmFtZSA9IHRoaXMuJCgnI2xlZnRtYXBzcHAnKS52YWwoKTtcbiAgICAgIGlmIChfX2luZGV4T2YuY2FsbCh0aGlzLnNwZWNpZXNTY2lOYW1lTGlzdCwgc3BwTmFtZSkgPj0gMCkge1xuICAgICAgICB0aGlzLiQoJy5idG4tY29weS1ydGwnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJCgnLmJ0bi1jb3B5LXJ0bCcpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIG5ld0xlZnRJbmZvID0ge1xuICAgICAgICBzcGVjaWVzTmFtZTogc3BwTmFtZSxcbiAgICAgICAgeWVhcjogdGhpcy4kKCcjbGVmdG1hcHllYXInKS52YWwoKSxcbiAgICAgICAgc2NlbmFyaW86IHRoaXMuJCgnI2xlZnRtYXBzY2VuYXJpbycpLnZhbCgpLFxuICAgICAgICBnY206IHRoaXMuJCgnI2xlZnRtYXBnY20nKS52YWwoKVxuICAgICAgfTtcbiAgICAgIGlmICh0aGlzLmxlZnRJbmZvICYmIF8uaXNFcXVhbChuZXdMZWZ0SW5mbywgdGhpcy5sZWZ0SW5mbykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMubGVmdEluZm8gJiYgbmV3TGVmdEluZm8uc3BlY2llc05hbWUgPT09IHRoaXMubGVmdEluZm8uc3BlY2llc05hbWUgJiYgbmV3TGVmdEluZm8ueWVhciA9PT0gdGhpcy5sZWZ0SW5mby55ZWFyICYmIG5ld0xlZnRJbmZvLnllYXIgPT09ICdiYXNlbGluZScpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy5sZWZ0SW5mbyA9IG5ld0xlZnRJbmZvO1xuICAgICAgdGhpcy5hZGRNYXBMYXllcignbGVmdCcpO1xuICAgICAgcmV0dXJuIHRoaXMuYWRkTWFwVGFnKCdsZWZ0Jyk7XG4gICAgfSxcbiAgICByaWdodFNpZGVVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5ld1JpZ2h0SW5mbywgc3BwTmFtZTtcbiAgICAgIGRlYnVnKCdBcHBWaWV3LnJpZ2h0U2lkZVVwZGF0ZScpO1xuICAgICAgc3BwTmFtZSA9IHRoaXMuJCgnI3JpZ2h0bWFwc3BwJykudmFsKCk7XG4gICAgICBpZiAoX19pbmRleE9mLmNhbGwodGhpcy5zcGVjaWVzU2NpTmFtZUxpc3QsIHNwcE5hbWUpID49IDApIHtcbiAgICAgICAgdGhpcy4kKCcuYnRuLWNvcHktbHRyJykucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiQoJy5idG4tY29weS1sdHInKS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBuZXdSaWdodEluZm8gPSB7XG4gICAgICAgIHNwZWNpZXNOYW1lOiBzcHBOYW1lLFxuICAgICAgICB5ZWFyOiB0aGlzLiQoJyNyaWdodG1hcHllYXInKS52YWwoKSxcbiAgICAgICAgc2NlbmFyaW86IHRoaXMuJCgnI3JpZ2h0bWFwc2NlbmFyaW8nKS52YWwoKSxcbiAgICAgICAgZ2NtOiB0aGlzLiQoJyNyaWdodG1hcGdjbScpLnZhbCgpXG4gICAgICB9O1xuICAgICAgaWYgKHRoaXMucmlnaHRJbmZvICYmIF8uaXNFcXVhbChuZXdSaWdodEluZm8sIHRoaXMucmlnaHRJbmZvKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5yaWdodEluZm8gJiYgbmV3UmlnaHRJbmZvLnNwZWNpZXNOYW1lID09PSB0aGlzLnJpZ2h0SW5mby5zcGVjaWVzTmFtZSAmJiBuZXdSaWdodEluZm8ueWVhciA9PT0gdGhpcy5yaWdodEluZm8ueWVhciAmJiBuZXdSaWdodEluZm8ueWVhciA9PT0gJ2Jhc2VsaW5lJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICB0aGlzLnJpZ2h0SW5mbyA9IG5ld1JpZ2h0SW5mbztcbiAgICAgIHRoaXMuYWRkTWFwTGF5ZXIoJ3JpZ2h0Jyk7XG4gICAgICByZXR1cm4gdGhpcy5hZGRNYXBUYWcoJ3JpZ2h0Jyk7XG4gICAgfSxcbiAgICBhZGRNYXBUYWc6IGZ1bmN0aW9uKHNpZGUpIHtcbiAgICAgIHZhciBpbmZvLCB0YWc7XG4gICAgICBkZWJ1ZygnQXBwVmlldy5hZGRNYXBUYWcnKTtcbiAgICAgIGlmIChzaWRlID09PSAnbGVmdCcpIHtcbiAgICAgICAgaW5mbyA9IHRoaXMubGVmdEluZm87XG4gICAgICB9XG4gICAgICBpZiAoc2lkZSA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICBpbmZvID0gdGhpcy5yaWdodEluZm87XG4gICAgICB9XG4gICAgICB0YWcgPSBcIjxiPjxpPlwiICsgaW5mby5zcGVjaWVzTmFtZSArIFwiPC9pPjwvYj5cIjtcbiAgICAgIGlmIChpbmZvLnllYXIgPT09ICdiYXNlbGluZScpIHtcbiAgICAgICAgdGFnID0gXCJjdXJyZW50IFwiICsgdGFnICsgXCIgZGlzdHJpYnV0aW9uXCI7XG4gICAgICB9IGVsc2UgaWYgKGluZm8uZ2NtID09PSAnYWxsJykge1xuICAgICAgICB0YWcgPSBcIjxiPm1lZGlhbjwvYj4gcHJvamVjdGlvbnMgZm9yIFwiICsgdGFnICsgXCIgaW4gPGI+XCIgKyBpbmZvLnllYXIgKyBcIjwvYj4gaWYgPGI+XCIgKyBpbmZvLnNjZW5hcmlvICsgXCI8L2I+XCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YWcgPSBcIjxiPlwiICsgaW5mby5nY20gKyBcIjwvYj4gcHJvamVjdGlvbnMgZm9yIFwiICsgdGFnICsgXCIgaW4gPGI+XCIgKyBpbmZvLnllYXIgKyBcIjwvYj4gaWYgPGI+XCIgKyBpbmZvLnNjZW5hcmlvICsgXCI8L2I+XCI7XG4gICAgICB9XG4gICAgICBpZiAoc2lkZSA9PT0gJ2xlZnQnKSB7XG4gICAgICAgIHRoaXMubGVmdFRhZy5maW5kKCcubGVmdGxheWVybmFtZScpLmh0bWwodGFnKTtcbiAgICAgIH1cbiAgICAgIGlmIChzaWRlID09PSAncmlnaHQnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJpZ2h0VGFnLmZpbmQoJy5yaWdodGxheWVybmFtZScpLmh0bWwodGFnKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGFkZE1hcExheWVyOiBmdW5jdGlvbihzaWRlKSB7XG4gICAgICB2YXIgZnV0dXJlTW9kZWxQb2ludCwgbGF5ZXIsIGxvYWRDbGFzcywgbWFwRGF0YSwgc2lkZUluZm87XG4gICAgICBkZWJ1ZygnQXBwVmlldy5hZGRNYXBMYXllcicpO1xuICAgICAgaWYgKHNpZGUgPT09ICdsZWZ0Jykge1xuICAgICAgICBzaWRlSW5mbyA9IHRoaXMubGVmdEluZm87XG4gICAgICB9XG4gICAgICBpZiAoc2lkZSA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICBzaWRlSW5mbyA9IHRoaXMucmlnaHRJbmZvO1xuICAgICAgfVxuICAgICAgZnV0dXJlTW9kZWxQb2ludCA9IFtzaWRlSW5mby5zY2VuYXJpbywgc2lkZUluZm8uZ2NtLCBzaWRlSW5mby55ZWFyXS5qb2luKCdfJyk7XG4gICAgICBpZiAoc2lkZUluZm8ueWVhciA9PT0gJ2Jhc2VsaW5lJykge1xuICAgICAgICBmdXR1cmVNb2RlbFBvaW50ID0gJzE5OTAnO1xuICAgICAgfVxuICAgICAgbWFwRGF0YSA9IFt0aGlzLnJlc29sdmVQbGFjZWhvbGRlcnModGhpcy5zcGVjaWVzRGF0YVVybCksIHNpZGVJbmZvLnNwZWNpZXNOYW1lLnJlcGxhY2UoJyAnLCAnXycpLCAnb3V0cHV0JywgZnV0dXJlTW9kZWxQb2ludCArICcuYXNjLmd6J10uam9pbignLycpO1xuICAgICAgbGF5ZXIgPSBMLnRpbGVMYXllci53bXModGhpcy5yZXNvbHZlUGxhY2Vob2xkZXJzKHRoaXMucmFzdGVyQXBpVXJsKSwge1xuICAgICAgICBEQVRBX1VSTDogbWFwRGF0YSxcbiAgICAgICAgbGF5ZXJzOiAnREVGQVVMVCcsXG4gICAgICAgIGZvcm1hdDogJ2ltYWdlL3BuZycsXG4gICAgICAgIHRyYW5zcGFyZW50OiB0cnVlXG4gICAgICB9KTtcbiAgICAgIGxvYWRDbGFzcyA9ICcnICsgc2lkZSArICdsb2FkaW5nJztcbiAgICAgIGxheWVyLm9uKCdsb2FkaW5nJywgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuJGVsLmFkZENsYXNzKGxvYWRDbGFzcyk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgICBsYXllci5vbignbG9hZCcsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLiRlbC5yZW1vdmVDbGFzcyhsb2FkQ2xhc3MpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgICAgbGF5ZXIuYWRkVG8odGhpcy5tYXApO1xuICAgICAgaWYgKHNpZGUgPT09ICdsZWZ0Jykge1xuICAgICAgICBpZiAodGhpcy5sZWZ0TGF5ZXIpIHtcbiAgICAgICAgICB0aGlzLm1hcC5yZW1vdmVMYXllcih0aGlzLmxlZnRMYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sZWZ0TGF5ZXIgPSBsYXllcjtcbiAgICAgIH1cbiAgICAgIGlmIChzaWRlID09PSAncmlnaHQnKSB7XG4gICAgICAgIGlmICh0aGlzLnJpZ2h0TGF5ZXIpIHtcbiAgICAgICAgICB0aGlzLm1hcC5yZW1vdmVMYXllcih0aGlzLnJpZ2h0TGF5ZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmlnaHRMYXllciA9IGxheWVyO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMucmVzaXplVGhpbmdzKCk7XG4gICAgfSxcbiAgICBjZW50cmVNYXA6IGZ1bmN0aW9uKHJlcGVhdGVkbHlGb3IpIHtcbiAgICAgIHZhciBsYXRlciwgcmVjZW50cmUsIF9pLCBfcmVzdWx0cztcbiAgICAgIGRlYnVnKCdBcHBWaWV3LmNlbnRyZU1hcCcpO1xuICAgICAgaWYgKCFyZXBlYXRlZGx5Rm9yKSB7XG4gICAgICAgIHJlcGVhdGVkbHlGb3IgPSA1MDA7XG4gICAgICB9XG4gICAgICByZWNlbnRyZSA9IChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMubWFwLmludmFsaWRhdGVTaXplKGZhbHNlKTtcbiAgICAgICAgICByZXR1cm4gX3RoaXMucmVzaXplVGhpbmdzKCk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKTtcbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKGxhdGVyID0gX2kgPSAwOyBfaSA8PSByZXBlYXRlZGx5Rm9yOyBsYXRlciA9IF9pICs9IDI1KSB7XG4gICAgICAgIF9yZXN1bHRzLnB1c2goc2V0VGltZW91dChyZWNlbnRyZSwgbGF0ZXIpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICB9LFxuICAgIHRvZ2dsZUZvcm1zOiBmdW5jdGlvbigpIHtcbiAgICAgIGRlYnVnKCdBcHBWaWV3LnRvZ2dsZUZvcm1zJyk7XG4gICAgICB0aGlzLiRlbC50b2dnbGVDbGFzcygnc2hvd2Zvcm1zJyk7XG4gICAgICByZXR1cm4gdGhpcy5jZW50cmVNYXAoKTtcbiAgICB9LFxuICAgIHRvZ2dsZVNwbGl0dGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIGRlYnVnKCdBcHBWaWV3LnRvZ2dsZVNwbGl0dGVyJyk7XG4gICAgICB0aGlzLiRlbC50b2dnbGVDbGFzcygnc3BsaXQnKTtcbiAgICAgIGlmICh0aGlzLiRlbC5oYXNDbGFzcygnc3BsaXQnKSkge1xuICAgICAgICB0aGlzLmFjdGl2YXRlU3BsaXR0ZXIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGVhY3RpdmF0ZVNwbGl0dGVyKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5jZW50cmVNYXAoKTtcbiAgICB9LFxuICAgIGZldGNoU3BlY2llc0luZm86IGZ1bmN0aW9uKCkge1xuICAgICAgZGVidWcoJ0FwcFZpZXcuZmV0Y2hTcGVjaWVzSW5mbycpO1xuICAgICAgcmV0dXJuICQuYWpheCh7XG4gICAgICAgIHVybDogJy9zcGVjaWVzZGF0YS9zcGVjaWVzLmpzb24nLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICB9KS5kb25lKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIHZhciBjb21tb25OYW1lV3JpdGVyLCBzcGVjaWVzTG9va3VwTGlzdCwgc3BlY2llc1NjaU5hbWVMaXN0O1xuICAgICAgICAgIHNwZWNpZXNMb29rdXBMaXN0ID0gW107XG4gICAgICAgICAgc3BlY2llc1NjaU5hbWVMaXN0ID0gW107XG4gICAgICAgICAgY29tbW9uTmFtZVdyaXRlciA9IGZ1bmN0aW9uKHNjaU5hbWUpIHtcbiAgICAgICAgICAgIHZhciBzY2lOYW1lUG9zdGZpeDtcbiAgICAgICAgICAgIHNjaU5hbWVQb3N0Zml4ID0gXCIgKFwiICsgc2NpTmFtZSArIFwiKVwiO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNuSW5kZXgsIGNuKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzcGVjaWVzTG9va3VwTGlzdC5wdXNoKHtcbiAgICAgICAgICAgICAgICBsYWJlbDogY24gKyBzY2lOYW1lUG9zdGZpeCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogc2NpTmFtZVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfTtcbiAgICAgICAgICAkLmVhY2goZGF0YSwgZnVuY3Rpb24oc2NpTmFtZSwgY29tbW9uTmFtZXMpIHtcbiAgICAgICAgICAgIHNwZWNpZXNTY2lOYW1lTGlzdC5wdXNoKHNjaU5hbWUpO1xuICAgICAgICAgICAgaWYgKGNvbW1vbk5hbWVzKSB7XG4gICAgICAgICAgICAgIHJldHVybiAkLmVhY2goY29tbW9uTmFtZXMsIGNvbW1vbk5hbWVXcml0ZXIoc2NpTmFtZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNwZWNpZXNMb29rdXBMaXN0LnB1c2goe1xuICAgICAgICAgICAgICAgIGxhYmVsOiBzY2lOYW1lLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBzY2lOYW1lXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIF90aGlzLnNwZWNpZXNMb29rdXBMaXN0ID0gc3BlY2llc0xvb2t1cExpc3Q7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLnNwZWNpZXNTY2lOYW1lTGlzdCA9IHNwZWNpZXNTY2lOYW1lTGlzdDtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9LFxuICAgIGJ1aWxkTGVmdEZvcm06IGZ1bmN0aW9uKCkge1xuICAgICAgZGVidWcoJ0FwcFZpZXcuYnVpbGRMZWZ0Rm9ybScpO1xuICAgICAgcmV0dXJuIHRoaXMuc3BlY2llc0luZm9GZXRjaFByb2Nlc3MuZG9uZSgoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciAkbGVmdG1hcHNwcDtcbiAgICAgICAgICAkbGVmdG1hcHNwcCA9IF90aGlzLiQoJyNsZWZ0bWFwc3BwJyk7XG4gICAgICAgICAgcmV0dXJuICRsZWZ0bWFwc3BwLmF1dG9jb21wbGV0ZSh7XG4gICAgICAgICAgICBzb3VyY2U6IF90aGlzLnNwZWNpZXNMb29rdXBMaXN0LFxuICAgICAgICAgICAgYXBwZW5kVG86IF90aGlzLiRlbCxcbiAgICAgICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLiRlbC50cmlnZ2VyKCdsZWZ0bWFwdXBkYXRlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfSxcbiAgICBidWlsZFJpZ2h0Rm9ybTogZnVuY3Rpb24oKSB7XG4gICAgICBkZWJ1ZygnQXBwVmlldy5idWlsZFJpZ2h0Rm9ybScpO1xuICAgICAgcmV0dXJuIHRoaXMuc3BlY2llc0luZm9GZXRjaFByb2Nlc3MuZG9uZSgoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciAkcmlnaHRtYXBzcHA7XG4gICAgICAgICAgJHJpZ2h0bWFwc3BwID0gX3RoaXMuJCgnI3JpZ2h0bWFwc3BwJyk7XG4gICAgICAgICAgcmV0dXJuICRyaWdodG1hcHNwcC5hdXRvY29tcGxldGUoe1xuICAgICAgICAgICAgc291cmNlOiBfdGhpcy5zcGVjaWVzTG9va3VwTGlzdCxcbiAgICAgICAgICAgIGFwcGVuZFRvOiBfdGhpcy4kZWwsXG4gICAgICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBfdGhpcy4kZWwudHJpZ2dlcigncmlnaHRtYXB1cGRhdGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9LFxuICAgIHN0YXJ0U3BsaXR0ZXJUcmFja2luZzogZnVuY3Rpb24oKSB7XG4gICAgICBkZWJ1ZygnQXBwVmlldy5zdGFydFNwbGl0dGVyVHJhY2tpbmcnKTtcbiAgICAgIHRoaXMudHJhY2tTcGxpdHRlciA9IHRydWU7XG4gICAgICB0aGlzLnNwbGl0TGluZS5hZGRDbGFzcygnZHJhZ2dpbmcnKTtcbiAgICAgIHJldHVybiB0aGlzLmxvY2F0ZVNwbGl0dGVyKCk7XG4gICAgfSxcbiAgICBsb2NhdGVTcGxpdHRlcjogZnVuY3Rpb24oKSB7XG4gICAgICBkZWJ1ZygnQXBwVmlldy5sb2NhdGVTcGxpdHRlcicpO1xuICAgICAgaWYgKHRoaXMudHJhY2tTcGxpdHRlcikge1xuICAgICAgICB0aGlzLnJlc2l6ZVRoaW5ncygpO1xuICAgICAgICBpZiAodGhpcy50cmFja1NwbGl0dGVyID09PSAwKSB7XG4gICAgICAgICAgdGhpcy50cmFja1NwbGl0dGVyID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy50cmFja1NwbGl0dGVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgdGhpcy50cmFja1NwbGl0dGVyIC09IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQodGhpcy5sb2NhdGVTcGxpdHRlciwgdGhpcy50cmFja1BlcmlvZCk7XG4gICAgICB9XG4gICAgfSxcbiAgICByZXNpemVUaGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRtYXBCb3gsIGJvdHRvbVJpZ2h0LCBsYXllckJvdHRvbSwgbGF5ZXJUb3AsIGxlZnRMZWZ0LCBsZWZ0TWFwLCBtYXBCb3VuZHMsIG1hcEJveCwgbmV3TGVmdFdpZHRoLCByaWdodE1hcCwgcmlnaHRSaWdodCwgc3BsaXRQb2ludCwgc3BsaXRYLCB0b3BMZWZ0O1xuICAgICAgZGVidWcoJ0FwcFZpZXcucmVzaXplVGhpbmdzJyk7XG4gICAgICBpZiAodGhpcy5sZWZ0TGF5ZXIpIHtcbiAgICAgICAgbGVmdE1hcCA9ICQodGhpcy5sZWZ0TGF5ZXIuZ2V0Q29udGFpbmVyKCkpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMucmlnaHRMYXllcikge1xuICAgICAgICByaWdodE1hcCA9ICQodGhpcy5yaWdodExheWVyLmdldENvbnRhaW5lcigpKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLiRlbC5oYXNDbGFzcygnc3BsaXQnKSkge1xuICAgICAgICBuZXdMZWZ0V2lkdGggPSB0aGlzLnNwbGl0VGh1bWIucG9zaXRpb24oKS5sZWZ0ICsgKHRoaXMuc3BsaXRUaHVtYi53aWR0aCgpIC8gMi4wKTtcbiAgICAgICAgbWFwQm94ID0gdGhpcy5tYXAuZ2V0Q29udGFpbmVyKCk7XG4gICAgICAgICRtYXBCb3ggPSAkKG1hcEJveCk7XG4gICAgICAgIG1hcEJvdW5kcyA9IG1hcEJveC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdG9wTGVmdCA9IHRoaXMubWFwLmNvbnRhaW5lclBvaW50VG9MYXllclBvaW50KFswLCAwXSk7XG4gICAgICAgIHNwbGl0UG9pbnQgPSB0aGlzLm1hcC5jb250YWluZXJQb2ludFRvTGF5ZXJQb2ludChbbmV3TGVmdFdpZHRoLCAwXSk7XG4gICAgICAgIGJvdHRvbVJpZ2h0ID0gdGhpcy5tYXAuY29udGFpbmVyUG9pbnRUb0xheWVyUG9pbnQoWyRtYXBCb3gud2lkdGgoKSwgJG1hcEJveC5oZWlnaHQoKV0pO1xuICAgICAgICBsYXllclRvcCA9IHRvcExlZnQueTtcbiAgICAgICAgbGF5ZXJCb3R0b20gPSBib3R0b21SaWdodC55O1xuICAgICAgICBzcGxpdFggPSBzcGxpdFBvaW50LnggLSBtYXBCb3VuZHMubGVmdDtcbiAgICAgICAgbGVmdExlZnQgPSB0b3BMZWZ0LnggLSBtYXBCb3VuZHMubGVmdDtcbiAgICAgICAgcmlnaHRSaWdodCA9IGJvdHRvbVJpZ2h0Lng7XG4gICAgICAgIHRoaXMuc3BsaXRMaW5lLmNzcygnbGVmdCcsIG5ld0xlZnRXaWR0aCk7XG4gICAgICAgIHRoaXMubGVmdFRhZy5hdHRyKCdzdHlsZScsIFwiY2xpcDogcmVjdCgwLCBcIiArIG5ld0xlZnRXaWR0aCArIFwicHgsIGF1dG8sIDApXCIpO1xuICAgICAgICBpZiAodGhpcy5sZWZ0TGF5ZXIpIHtcbiAgICAgICAgICBsZWZ0TWFwLmF0dHIoJ3N0eWxlJywgXCJjbGlwOiByZWN0KFwiICsgbGF5ZXJUb3AgKyBcInB4LCBcIiArIHNwbGl0WCArIFwicHgsIFwiICsgbGF5ZXJCb3R0b20gKyBcInB4LCBcIiArIGxlZnRMZWZ0ICsgXCJweClcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucmlnaHRMYXllcikge1xuICAgICAgICAgIHJldHVybiByaWdodE1hcC5hdHRyKCdzdHlsZScsIFwiY2xpcDogcmVjdChcIiArIGxheWVyVG9wICsgXCJweCwgXCIgKyByaWdodFJpZ2h0ICsgXCJweCwgXCIgKyBsYXllckJvdHRvbSArIFwicHgsIFwiICsgc3BsaXRYICsgXCJweClcIik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubGVmdFRhZy5hdHRyKCdzdHlsZScsICdjbGlwOiBpbmhlcml0Jyk7XG4gICAgICAgIGlmICh0aGlzLmxlZnRMYXllcikge1xuICAgICAgICAgIGxlZnRNYXAuYXR0cignc3R5bGUnLCAnY2xpcDogaW5oZXJpdCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnJpZ2h0TGF5ZXIpIHtcbiAgICAgICAgICByZXR1cm4gcmlnaHRNYXAuYXR0cignc3R5bGUnLCAnY2xpcDogcmVjdCgwLDAsMCwwKScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBzdG9wU3BsaXR0ZXJUcmFja2luZzogZnVuY3Rpb24oKSB7XG4gICAgICBkZWJ1ZygnQXBwVmlldy5zdG9wU3BsaXR0ZXJUcmFja2luZycpO1xuICAgICAgdGhpcy5zcGxpdExpbmUucmVtb3ZlQ2xhc3MoJ2RyYWdnaW5nJyk7XG4gICAgICByZXR1cm4gdGhpcy50cmFja1NwbGl0dGVyID0gNTtcbiAgICB9LFxuICAgIGFjdGl2YXRlU3BsaXR0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgZGVidWcoJ0FwcFZpZXcuYWN0aXZhdGVTcGxpdHRlcicpO1xuICAgICAgdGhpcy5zcGxpdFRodW1iLmRyYWdnYWJsZSh7XG4gICAgICAgIGNvbnRhaW5tZW50OiAkKCcjbWFwd3JhcHBlcicpLFxuICAgICAgICBzY3JvbGw6IGZhbHNlLFxuICAgICAgICBzdGFydDogdGhpcy5zdGFydFNwbGl0dGVyVHJhY2tpbmcsXG4gICAgICAgIGRyYWc6IHRoaXMucmVzaXplVGhpbmdzLFxuICAgICAgICBzdG9wOiB0aGlzLnN0b3BTcGxpdHRlclRyYWNraW5nXG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzLnJlc2l6ZVRoaW5ncygpO1xuICAgIH0sXG4gICAgZGVhY3RpdmF0ZVNwbGl0dGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIGRlYnVnKCdBcHBWaWV3LmRlYWN0aXZhdGVTcGxpdHRlcicpO1xuICAgICAgdGhpcy5zcGxpdFRodW1iLmRyYWdnYWJsZSgnZGVzdHJveScpO1xuICAgICAgcmV0dXJuIHRoaXMucmVzaXplVGhpbmdzKCk7XG4gICAgfVxuICB9LCB7XG4gICAgdGVtcGxhdGVzOiB7XG4gICAgICBsYXlvdXQ6IF8udGVtcGxhdGUoXCI8ZGl2IGNsYXNzPVxcXCJzcGxpdGxpbmVcXFwiPiZuYnNwOzwvZGl2PlxcbjxkaXYgY2xhc3M9XFxcInNwbGl0dGh1bWJcXFwiPjxzcGFuPiYjeDI3NmU7ICYjeDI3NmY7PC9zcGFuPjwvZGl2PlxcbjxkaXYgY2xhc3M9XFxcImxlZnQgdGFnXFxcIj48JT0gbGVmdFRhZyAlPjwvZGl2PlxcbjxkaXYgY2xhc3M9XFxcInJpZ2h0IHRhZ1xcXCI+PCU9IHJpZ2h0VGFnICU+PC9kaXY+XFxuPGRpdiBjbGFzcz1cXFwibGVmdCBzaWRlIGZvcm1cXFwiPjwlPSBsZWZ0Rm9ybSAlPjwvZGl2PlxcbjxkaXYgY2xhc3M9XFxcInJpZ2h0IHNpZGUgZm9ybVxcXCI+PCU9IHJpZ2h0Rm9ybSAlPjwvZGl2PlxcbjxkaXYgY2xhc3M9XFxcImxlZnQgbG9hZGVyXFxcIj48aW1nIHNyYz1cXFwiL3N0YXRpYy9pbWFnZXMvc3Bpbm5lci5sb2FkaW5mby5uZXQuZ2lmXFxcIiAvPjwvZGl2PlxcbjxkaXYgY2xhc3M9XFxcInJpZ2h0IGxvYWRlclxcXCI+PGltZyBzcmM9XFxcIi9zdGF0aWMvaW1hZ2VzL3NwaW5uZXIubG9hZGluZm8ubmV0LmdpZlxcXCIgLz48L2Rpdj5cXG48ZGl2IGlkPVxcXCJtYXB3cmFwcGVyXFxcIj48ZGl2IGlkPVxcXCJtYXBcXFwiPjwvZGl2PjwvZGl2PlwiKSxcbiAgICAgIGxlZnRUYWc6IF8udGVtcGxhdGUoXCI8ZGl2IGNsYXNzPVxcXCJzaG93XFxcIj5cXG4gICAgPHNwYW4gY2xhc3M9XFxcImxlZnRsYXllcm5hbWVcXFwiPnBsYWluIG1hcDwvc3Bhbj5cXG4gICAgPGJyPlxcbiAgICA8YnV0dG9uIGNsYXNzPVxcXCJidG4tY2hhbmdlXFxcIj5zZXR0aW5nczwvYnV0dG9uPlxcbiAgICA8YnV0dG9uIGNsYXNzPVxcXCJidG4tY29tcGFyZVxcXCI+c2hvdy9oaWRlIGNvbXBhcmlzb24gbWFwPC9idXR0b24+XFxuPC9kaXY+XFxuPGRpdiBjbGFzcz1cXFwiZWRpdFxcXCI+XFxuICAgIDxpbnB1dCBpZD1cXFwibGVmdG1hcHNwcFxcXCIgbmFtZT1cXFwibGVmdG1hcHNwcFxcXCIgcGxhY2Vob2xkZXI9XFxcIiZoZWxsaXA7IHNwZWNpZXMgb3IgZ3JvdXAgJmhlbGxpcDtcXFwiIC8+XFxuICAgIDwhLS1cXG4gICAgPGJ1dHRvbiBjbGFzcz1cXFwiYnRuLWNoYW5nZVxcXCI+aGlkZSBzZXR0aW5nczwvYnV0dG9uPlxcbiAgICA8YnV0dG9uIGNsYXNzPVxcXCJidG4tY29tcGFyZVxcXCI+Y29tcGFyZSArLy08L2J1dHRvbj5cXG4gICAgLS0+XFxuPC9kaXY+XCIpLFxuICAgICAgcmlnaHRUYWc6IF8udGVtcGxhdGUoXCI8ZGl2IGNsYXNzPVxcXCJzaG93XFxcIj5cXG4gICAgPHNwYW4gY2xhc3M9XFxcInJpZ2h0bGF5ZXJuYW1lXFxcIj4obm8gZGlzdHJpYnV0aW9uKTwvc3Bhbj5cXG4gICAgPGJyPlxcbiAgICA8YnV0dG9uIGNsYXNzPVxcXCJidG4tY2hhbmdlXFxcIj5zZXR0aW5nczwvYnV0dG9uPlxcbiAgICA8YnV0dG9uIGNsYXNzPVxcXCJidG4tY29tcGFyZVxcXCI+c2hvdy9oaWRlIGNvbXBhcmlzb24gbWFwPC9idXR0b24+XFxuPC9kaXY+XFxuPGRpdiBjbGFzcz1cXFwiZWRpdFxcXCI+XFxuICAgIDxpbnB1dCBpZD1cXFwicmlnaHRtYXBzcHBcXFwiIG5hbWU9XFxcInJpZ2h0bWFwc3BwXFxcIiBwbGFjZWhvbGRlcj1cXFwiJmhlbGxpcDsgc3BlY2llcyBvciBncm91cCAmaGVsbGlwO1xcXCIgLz5cXG48L2Rpdj5cIiksXG4gICAgICBsZWZ0Rm9ybTogXy50ZW1wbGF0ZShcIjxmaWVsZHNldD5cXG4gICAgPGJ1dHRvbiBjbGFzcz1cXFwiYnRuLWNvcHktcnRsXFxcIj5jb3B5IHJpZ2h0IG1hcCAmbGFxdW87PC9idXR0b24+XFxuPC9maWVsZHNldD5cXG48ZmllbGRzZXQ+XFxuICAgIDxsZWdlbmQ+dGltZSBwb2ludDwvbGVnZW5kPlxcbiAgICA8c2VsZWN0IGNsYXNzPVxcXCJsZWZ0XFxcIiBpZD1cXFwibGVmdG1hcHllYXJcXFwiPlxcbiAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYmFzZWxpbmVcXFwiPmN1cnJlbnQ8L29wdGlvbj5cXG4gICAgICAgIDxvcHRpb24+MjAxNTwvb3B0aW9uPlxcbiAgICAgICAgPG9wdGlvbj4yMDI1PC9vcHRpb24+XFxuICAgICAgICA8b3B0aW9uPjIwMzU8L29wdGlvbj5cXG4gICAgICAgIDxvcHRpb24+MjA0NTwvb3B0aW9uPlxcbiAgICAgICAgPG9wdGlvbj4yMDU1PC9vcHRpb24+XFxuICAgICAgICA8b3B0aW9uPjIwNjU8L29wdGlvbj5cXG4gICAgICAgIDxvcHRpb24+MjA3NTwvb3B0aW9uPlxcbiAgICAgICAgPG9wdGlvbj4yMDg1PC9vcHRpb24+XFxuICAgIDwvc2VsZWN0PlxcbjwvZmllbGRzZXQ+XFxuPGZpZWxkc2V0PlxcbiAgICA8bGVnZW5kPmVtaXNzaW9uIHNjZW5hcmlvPC9sZWdlbmQ+XFxuICAgIDxsYWJlbD48c3Bhbj5SQ1AgNC41PC9zcGFuPiA8aW5wdXQgbmFtZT1cXFwibGVmdG1hcHNjZW5hcmlvXFxcIiB0eXBlPVxcXCJyYWRpb1xcXCIgdmFsdWU9XFxcIlJDUDQ1XFxcIj4gbG93ZXIgZW1pc3Npb25zPC9sYWJlbD5cXG4gICAgPGxhYmVsPjxzcGFuPlJDUCA4LjU8L3NwYW4+IDxpbnB1dCBuYW1lPVxcXCJsZWZ0bWFwc2NlbmFyaW9cXFwiIHR5cGU9XFxcInJhZGlvXFxcIiB2YWx1ZT1cXFwiUkNQODVcXFwiIGNoZWNrZWQ9XFxcImNoZWNrZWRcXFwiPiBidXNpbmVzcyBhcyB1c3VhbDwvbGFiZWw+XFxuPC9maWVsZHNldD5cXG48ZmllbGRzZXQ+XFxuICAgIDxsZWdlbmQ+bW9kZWwgc3VtbWFyeTwvbGVnZW5kPlxcbiAgICA8c2VsZWN0IGNsYXNzPVxcXCJsZWZ0XFxcIiBpZD1cXFwibGVmdG1hcGdjbVxcXCI+XFxuICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCIxMHRoXFxcIj4xMHRoIHBlcmNlbnRpbGU8L29wdGlvbj5cXG4gICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFsbFxcXCIgc2VsZWN0ZWQ9XFxcInNlbGVjdGVkXFxcIj41MHRoIHBlcmNlbnRpbGU8L29wdGlvbj5cXG4gICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIjkwdGhcXFwiPjkwdGggcGVyY2VudGlsZTwvb3B0aW9uPlxcbiAgICA8L3NlbGVjdD5cXG48L2ZpZWxkc2V0PjxmaWVsZHNldD5cXG4gICAgPGxlZ2VuZD48L2xlZ2VuZD5cXG4gICAgPGJ1dHRvbiBjbGFzcz1cXFwiYnRuLWNoYW5nZVxcXCI+aGlkZSBzZXR0aW5nczwvYnV0dG9uPlxcbjwvZmllbGRzZXQ+PGZpZWxkc2V0PlxcbiAgICA8YnV0dG9uIGNsYXNzPVxcXCJidG4tY29tcGFyZVxcXCI+Y29tcGFyZSArLy08L2J1dHRvbj5cXG48L2ZpZWxkc2V0PlwiKSxcbiAgICAgIHJpZ2h0Rm9ybTogXy50ZW1wbGF0ZShcIjxmaWVsZHNldD5cXG48YnV0dG9uIGNsYXNzPVxcXCJidG4tY29weS1sdHJcXFwiPiZyYXF1bzsgY29weSBsZWZ0IG1hcDwvYnV0dG9uPlxcbjwvZmllbGRzZXQ+PGZpZWxkc2V0PlxcbjxzZWxlY3QgY2xhc3M9XFxcInJpZ2h0XFxcIiBpZD1cXFwicmlnaHRtYXB5ZWFyXFxcIj5cXG4gICAgPG9wdGlvbiB2YWx1ZT1cXFwiYmFzZWxpbmVcXFwiPmJhc2VsaW5lPC9vcHRpb24+XFxuICAgIDxvcHRpb24+MjAxNTwvb3B0aW9uPlxcbiAgICA8b3B0aW9uPjIwMjU8L29wdGlvbj5cXG4gICAgPG9wdGlvbj4yMDM1PC9vcHRpb24+XFxuICAgIDxvcHRpb24+MjA0NTwvb3B0aW9uPlxcbiAgICA8b3B0aW9uPjIwNTU8L29wdGlvbj5cXG4gICAgPG9wdGlvbj4yMDY1PC9vcHRpb24+XFxuICAgIDxvcHRpb24+MjA3NTwvb3B0aW9uPlxcbiAgICA8b3B0aW9uPjIwODU8L29wdGlvbj5cXG48L3NlbGVjdD5cXG48L2ZpZWxkc2V0PjxmaWVsZHNldD5cXG48c2VsZWN0IGNsYXNzPVxcXCJyaWdodFxcXCIgaWQ9XFxcInJpZ2h0bWFwc2NlbmFyaW9cXFwiPlxcbiAgICA8b3B0aW9uIHZhbHVlPVxcXCJSQ1AzUERcXFwiPlJDUCAzUEQ8L29wdGlvbj5cXG4gICAgPG9wdGlvbiB2YWx1ZT1cXFwiUkNQNDVcXFwiPlJDUCA0LjU8L29wdGlvbj5cXG4gICAgPG9wdGlvbiB2YWx1ZT1cXFwiUkNQNlxcXCI+UkNQIDY8L29wdGlvbj5cXG4gICAgPG9wdGlvbiB2YWx1ZT1cXFwiUkNQODVcXFwiIHNlbGVjdGVkPVxcXCJzZWxlY3RlZFxcXCI+UkNQIDguNTwvb3B0aW9uPlxcbjwvc2VsZWN0PlxcbjwvZmllbGRzZXQ+PGZpZWxkc2V0PlxcbjxzZWxlY3QgY2xhc3M9XFxcInJpZ2h0XFxcIiBpZD1cXFwicmlnaHRtYXBnY21cXFwiPlxcbiAgICA8b3B0aW9uIHZhbHVlPVxcXCIxMHRoXFxcIj4xMHRoIHBlcmNlbnRpbGU8L29wdGlvbj5cXG4gICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWxsXFxcIiBzZWxlY3RlZD1cXFwic2VsZWN0ZWRcXFwiPjUwdGggcGVyY2VudGlsZTwvb3B0aW9uPlxcbiAgICA8b3B0aW9uIHZhbHVlPVxcXCI5MHRoXFxcIj45MHRoIHBlcmNlbnRpbGU8L29wdGlvbj5cXG48L3NlbGVjdD5cXG48L2ZpZWxkc2V0PjxmaWVsZHNldD5cXG48bGVnZW5kPjwvbGVnZW5kPlxcbjxidXR0b24gY2xhc3M9XFxcImJ0bi1jaGFuZ2VcXFwiPmhpZGUgc2V0dGluZ3M8L2J1dHRvbj5cXG48L2ZpZWxkc2V0PjxmaWVsZHNldD5cXG48YnV0dG9uIGNsYXNzPVxcXCJidG4tY29tcGFyZVxcXCI+Y29tcGFyZSArLy08L2J1dHRvbj5cXG48L2ZpZWxkc2V0PlwiKVxuICAgIH1cbiAgfSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBBcHBWaWV3O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiXG4vLyBqUXVlcnkgcGx1Z2luXG4vLyBhdXRob3I6IERhbmllbCBCYWlyZCA8ZGFuaWVsQGRhbmllbGJhaXJkLmNvbT5cbi8vIHZlcnNpb246IDAuMS4yMDE0MDIwNVxuXG4vL1xuLy8gVGhpcyBtYW5hZ2VzIG1lbnVzLCBzdWJtZW51cywgcGFuZWxzLCBhbmQgcGFnZXMuXG4vLyBMaWtlIHRoaXM6XG4vLyAtLS0uLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0uLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0uLS0tXG4vLyAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICB8XG4vLyAgICB8ICBTZWxlY3RlZCBNYWluIE1lbnUgSXRlbSAgIC4tLS0tLS0tLS0tLS4gLi0tLS0tLS0tLS4gICB8ICBBbHQgTWFpbiBNZW51IEl0ZW0gIHwgIFRoaXJkIE1haW4gTWVudSBJdGVtICB8XG4vLyAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgLyAgU3ViaXRlbSAxICBcXCBTdWJpdGVtIDIgXFwgIHwgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgIHxcbi8vIC0tLSctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScgICAgICAgICAgICAgICAnLS0tLS0tLS0tLS0tLSctLS0tLS0tLS0tLS0tLS0tLS0tLS0tJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSctLS1cbi8vICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuLy8gICAgICAgfCAgIFBhbmVsIGZvciBTdWJpdGVtIDEsIHRoaXMgaXMgUGFnZSAxICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4vLyAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbi8vICAgICAgIHwgICBFYWNoIFBhbmVsIGNhbiBoYXZlIG11bHRpcGxlIHBhZ2VzLCBvbmUgcGFnZSBzaG93aW5nIGF0IGEgdGltZS4gIEJ1dHRvbnMgb24gcGFnZXMgc3dpdGNoICAgICAgfFxuLy8gICAgICAgfCAgIGJldHdlZW4gcGFnZXMuICBQYW5lbCBoZWlnaHQgYWRqdXN0cyB0byB0aGUgaGVpZ2h0IG9mIHRoZSBwYWdlLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4vLyAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbi8vICAgICAgIHwgICBbIHNlZSBwYWdlIDIgXSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuLy8gICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4vLyAgICAgICAnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSdcbi8vXG4vLyAtIG1lbnVzIGFyZSBhbHdheXMgPHVsPiB0YWdzOyBlYWNoIDxsaT4gaXMgYSBtZW51IGl0ZW1cbi8vIC0gYSBtYWluIG1lbnUgPGxpPiBtdXN0IGNvbnRhaW4gYW4gPGE+IHRhZyBhbmQgbWF5IGFsc28gY29udGFpbiBhIDx1bD4gc3VibWVudVxuLy8gLSBhIHN1Ym1lbnUgPGxpPiBtdXN0IGNvbnRhaW4gYW4gPGE+IHRhZyB3aXRoIGEgZGF0YS10YXJnZXRwYW5lbCBhdHRyaWJ1dGUgc2V0XG4vLyAtIFRoZXJlIGlzIGFsd2F5cyBhIHNpbmdsZSBzZWxlY3RlZCBtYWluIG1lbnUgaXRlbVxuLy8gLSBBIG1haW4gbWVudSBpdGVtIG1heSBlaXRoZXIgbGluayB0byBhbm90aGVyIHdlYnBhZ2UsIG9yIGhhdmUgYSBzdWJtZW51XG4vLyAtIFNlbGVjdGluZyBhIG1haW4gbWVudSBpdGVtIHdpbGwgc2hvdyBpdHMgc3VibWVudSwgaWYgaXQgaGFzIG9uZVxuLy8gLSBBIHN1Ym1lbnUgYWx3YXlzIGhhcyBhIHNpbmdsZSBpdGVtIHNlbGVjdGVkXG4vLyAtIENsaWNraW5nIGFuIGluYWN0aXZlIHN1Ym1lbnUgaXRlbSB3aWxsIHNob3cgaXRzIHBhbmVsXG4vLyAtIENsaWNraW5nIGEgc2VsZWN0ZWQgc3VibWVudSBpdGVtIHdpbGwgdG9nZ2xlIGl0cyBwYW5lbCBzaG93aW5nIDwtPiBoaWRpbmcgKCgoIE5COiBub3QgeWV0IGltcGxlbWVudGVkICkpKVxuLy8gLSBBIHBhbmVsIGluaXRpYWxseSBzaG93cyBpdHMgZmlyc3QgcGFnZVxuLy8gLSBTd2l0Y2hpbmcgcGFnZXMgaW4gYSBwYW5lbCBjaGFuZ2VzIHRoZSBwYW5lbCBoZWlnaHQgdG8gc3VpdCBpdHMgY3VycmVudCBwYWdlXG4vLyAtIEEgcGFuZWwgaXMgYSBIVE1MIGJsb2NrIGVsZW1lbnQgd2l0aCB0aGUgY2xhc3MgLm1zcHAtcGFuZWwgKGNhbiBiZSBvdmVycmlkZGVuIHZpYSBvcHRpb24pXG4vLyAtIElmIGEgcGFuZWwgY29udGFpbnMgcGFnZXMsIG9uZSBwYWdlIHNob3VsZCBoYXZlIHRoZSBjbGFzcyAuY3VycmVudCAoY2FuIGJlIG92ZXJyaWRkZW4gdmlhIG9wdGlvbilcbi8vIC0gQSBwYWdlIGlzIGEgSFRNTCBibG9jayBlbGVtZW50IHdpdGggdGhlIGNsYXNzIC5tc3BwLXBhZ2UgKGNhbiBiZSBvdmVycmlkZGVuIHZpYSBvcHRpb24pXG4vLyAtIDxidXR0b24+IG9yIDxhPiB0YWdzIGluIHBhZ2VzIHRoYXQgaGF2ZSBhIGRhdGEtdGFyZ2V0cGFnZSBhdHRyaWJ1dGUgc2V0IHdpbGwgc3dpdGNoIHRvIHRoZSBpbmRpY2F0ZWQgcGFnZVxuLy9cbi8vXG4vLyBUaGUgSFRNTCBzaG91bGQgbG9vayBsaWtlIHRoaXM6XG4vL1xuLy8gIDx1bCBjbGFzcz1cIm1lbnVcIj4gICAgICAgICAgICAgICAgICAgPCEtLSB0aGlzIGlzIHRoZSBtYWluIG1lbnUgLS0+XG4vLyAgICAgIDxsaSBjbGFzcz1cImN1cnJlbnRcIj4gICAgICAgICAgICA8IS0tIHRoaXMgaXMgYSBtYWluIG1lbnUgaXRlbSwgY3VycmVudGx5IHNlbGVjdGVkIC0tPlxuLy8gICAgICAgICAgPGE+Rmlyc3QgSXRlbTwvYT4gICAgICAgICAgIDwhLS0gdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIG1haW4gbWVudSAtLT5cbi8vICAgICAgICAgIDx1bD4gICAgICAgICAgICAgICAgICAgICAgICA8IS0tIGEgc3VibWVudSBpbiB0aGUgZmlyc3QgbWFpbiBtZW51IGl0ZW0gLS0+XG4vLyAgICAgICAgICAgICAgPGxpIGNsYXNzPVwiY3VycmVudFwiPiAgICA8IS0tIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgc3VibWVudSBpdGVtIC0tPlxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwhLS0gLnBhbmVsdHJpZ2dlciBhbmQgdGhlIGRhdGEtcGFuZWxpZCBhdHRyaWJ1dGUgYXJlIHJlcXVpcmVkIC0tPlxuLy8gICAgICAgICAgICAgICAgICA8YSBkYXRhLXRhcmdldHBhbmVsPVwicGFuZWwxXCI+ZG8gdGhlIHBhbmVsMSB0aGluZzwvYT5cbi8vICAgICAgICAgICAgICA8L2xpPlxuLy8gICAgICAgICAgICAgIDxsaT4uLi48L2xpPiAgICAgICAgICAgIDwhLS0gYW5vdGhlciBzdWJtZW51IGl0ZW0gLS0+XG4vLyAgICAgICAgICA8L3VsPlxuLy8gICAgICA8L2xpPlxuLy8gICAgICA8bGk+IDxhIGhyZWY9XCJhbm90aGVyX3BhZ2UuaHRtbFwiPmFub3RoZXIgcGFnZTwvYT4gPC9saT5cbi8vICAgICAgPGxpPiA8YT53aGF0ZXZlcjwvYT4gPC9saT5cbi8vICA8L3VsPlxuLy9cbi8vICA8ZGl2IGlkPVwicGFuZWwxXCIgY2xhc3M9XCJtc3BwLXBhbmVsXCI+XG4vLyAgICAgIDxkaXYgaWQ9XCJwYWdlMTFcIiBjbGFzcz1cIm1zcHAtcGFnZSBjdXJyZW50XCI+XG4vLyAgICAgICAgICBUaGlzIGlzIHRoZSBjdXJyZW50IHBhZ2Ugb24gcGFuZWwgMS5cbi8vICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGRhdGEtdGFyZ2V0cGFnZT1cInBhZ2UxMlwiPnNob3cgcGFnZSAyPC9idXR0b24+XG4vLyAgICAgIDwvZGl2PlxuLy8gICAgICA8ZGl2IGlkPVwicGFnZTEyXCIgY2xhc3M9XCJtc3BwLXBhZ2VcIj5cbi8vICAgICAgICAgIFRoaXMgaXMgdGhlIG90aGVyIHBhZ2Ugb24gcGFuZWwgMS5cbi8vICAgICAgICAgIDxhIGRhdGEtdGFyZ2V0cGFnZT1cInBhZ2UxMVwiPnNlZSB0aGUgZmlyc3QgcGFnZSBhZ2FpbjwvYT5cbi8vICAgICAgPC9kaXY+XG4vLyAgPC9kaXY+XG4vLyAgPGRpdiBpZD1cInBhbmVsMlwiIGNsYXNzPVwibXNwcC1wYW5lbFwiPlxuLy8gICAgICA8ZGl2IGlkPVwicGFnZTIxXCIgY2xhc3M9XCJtc3BwLXBhZ2UgY3VycmVudFwiPlxuLy8gICAgICAgICAgVGhpcyBpcyB0aGUgY3VycmVudCBwYWdlIG9uIHBhbmVsIDIuXG4vLyAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBkYXRhLXRhcmdldHBhZ2U9XCJwYWdlMjJcIj5zaG93IHBhZ2UgMjwvYnV0dG9uPlxuLy8gICAgICA8L2Rpdj5cbi8vICAgICAgPGRpdiBpZD1cInBhZ2UyMlwiIGNsYXNzPVwibXNwcC1wYWdlXCI+XG4vLyAgICAgICAgICBUaGlzIGlzIHRoZSBvdGhlciBwYWdlIG9uIHBhbmVsIDIuXG4vLyAgICAgICAgICA8YSBkYXRhLXRhcmdldHBhZ2U9XCJwYWdlMjFcIj5zZWUgdGhlIGZpcnN0IHBhZ2UgYWdhaW48L2E+XG4vLyAgICAgIDwvZGl2PlxuLy8gIDwvZGl2PlxuXG5cbjsoIGZ1bmN0aW9uKCQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuXG4gICAgLy8gbmFtZXNwYWNlIGNsaW1hcywgd2lkZ2V0IG5hbWUgbXNwcFxuICAgIC8vIHNlY29uZCBhcmcgaXMgdXNlZCBhcyB0aGUgd2lkZ2V0J3MgXCJwcm90b3R5cGVcIiBvYmplY3RcbiAgICAkLndpZGdldCggXCJjbGltYXMubXNwcFwiICwge1xuXG4gICAgICAgIC8vT3B0aW9ucyB0byBiZSB1c2VkIGFzIGRlZmF1bHRzXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkZhY3RvcjogMixcblxuICAgICAgICAgICAgbWFpbk1lbnVDbGFzczogJ21zcHAtbWFpbi1tZW51JyxcblxuICAgICAgICAgICAgcGFuZWxDbGFzczogJ21zcHAtcGFuZWwnLFxuICAgICAgICAgICAgcGFnZUNsYXNzOiAnbXNwcC1wYWdlJyxcblxuICAgICAgICAgICAgY2xlYXJmaXhDbGFzczogJ21zcHAtY2xlYXJmaXgnLFxuICAgICAgICAgICAgYWN0aXZlQ2xhc3M6ICdjdXJyZW50J1xuICAgICAgICB9LFxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vU2V0dXAgd2lkZ2V0IChlZy4gZWxlbWVudCBjcmVhdGlvbiwgYXBwbHkgdGhlbWluZ1xuICAgICAgICAvLyAsIGJpbmQgZXZlbnRzIGV0Yy4pXG4gICAgICAgIF9jcmVhdGU6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB2YXIgYmFzZSA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucztcblxuICAgICAgICAgICAgLy8gcG9wdWxhdGUgc29tZSBjb252ZW5pZW5jZSB2YXJpYWJsZXNcbiAgICAgICAgICAgIHZhciAkbWVudSA9IHRoaXMuZWxlbWVudDtcbiAgICAgICAgICAgIHRoaXMubWFpbk1lbnVJdGVtcyA9ICRtZW51LmNoaWxkcmVuKCdsaScpO1xuICAgICAgICAgICAgdGhpcy5wYW5lbHMgPSAkKCcuJyArIG9wdHMucGFuZWxDbGFzcyk7XG5cbiAgICAgICAgICAgIC8vIGRpc2FwcGVhciB3aGlsZSB3ZSBzb3J0IHRoaW5ncyBvdXRcbiAgICAgICAgICAgICRtZW51LmNzcyh7IG9wYWNpdHk6IDAgfSk7XG4gICAgICAgICAgICB0aGlzLnBhbmVscy5jc3MoeyBvcGFjaXR5OiAwIH0pO1xuXG4gICAgICAgICAgICAvLyBtYWtlIHNvbWUgRE9NIG1vZHNcbiAgICAgICAgICAgICRtZW51LmFkZENsYXNzKG9wdHMubWFpbk1lbnVDbGFzcyk7XG4gICAgICAgICAgICAkbWVudS5hZGRDbGFzcyhvcHRzLmNsZWFyZml4Q2xhc3MpO1xuICAgICAgICAgICAgdGhpcy5wYW5lbHMuYWRkQ2xhc3Mob3B0cy5jbGVhcmZpeENsYXNzKTtcblxuICAgICAgICAgICAgLy8gbGF5b3V0IHRoZSBtZW51XG4gICAgICAgICAgICB0aGlzLl9sYXlvdXRNZW51KCk7XG5cbiAgICAgICAgICAgIC8vIGxheW91dCB0aGUgcGFuZWxzXG4gICAgICAgICAgICB0aGlzLl9sYXlvdXRQYW5lbHMoKTtcblxuICAgICAgICAgICAgLy8gaG9vayB1cCBjbGljayBoYW5kbGluZyBldGNcbiAgICAgICAgICAgICRtZW51Lm9uKCdtc3Bwc2hvd21lbnUnLCB0aGlzLl9zaG93TWVudSk7XG4gICAgICAgICAgICAkbWVudS5vbignbXNwcHNob3dzdWJtZW51JywgdGhpcy5fc2hvd1N1Yk1lbnUpO1xuICAgICAgICAgICAgJG1lbnUub24oJ21zcHBzaG93cGFuZWwnLCB0aGlzLl9zaG93UGFuZWwpO1xuICAgICAgICAgICAgJG1lbnUub24oJ21zcHBzaG93cGFnZScsIHRoaXMuX3Nob3dQYWdlKTtcblxuICAgICAgICAgICAgLy8gYXR0YWNoIGhhbmRsZXJzIHRvIHRoZSBtZW51LXRyaWdnZXJzXG4gICAgICAgICAgICB0aGlzLm1haW5NZW51SXRlbXMuZWFjaCggZnVuY3Rpb24oaW5kZXgsIGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgbGkgbWVudSBpdGVtIGhhcyBhIGNoaWxkIGEgdGhhdCBpcyBpdCdzIHRyaWdnZXJcbiAgICAgICAgICAgICAgICAkKGl0ZW0pLmNoaWxkcmVuKCdhJykuY2xpY2soIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGJhc2UuX3RyaWdnZXIoJ3Nob3dtZW51JywgZXZlbnQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lbnVpdGVtOiBpdGVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkZ2V0OiBiYXNlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIGF0dGFjaCBoYW5kbGVycyB0byB0aGUgc3VibWVudSBpdGVtc1xuICAgICAgICAgICAgICAgICQoaXRlbSkuZmluZCgnbGknKS5lYWNoKCBmdW5jdGlvbihpbmRleCwgc3ViTWVudUl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgJChzdWJNZW51SXRlbSkuZmluZCgnYScpLmNsaWNrKCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFzZS5fdHJpZ2dlcignc2hvd3N1Ym1lbnUnLCBldmVudCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lbnVpdGVtOiBpdGVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Ym1lbnVpdGVtOiBzdWJNZW51SXRlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWRnZXQ6IGJhc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBhdHRhY2ggaGFuZGxlcnMgdG8gdGhlIHBhbmVsIHRyaWdnZXJzXG4gICAgICAgICAgICAkbWVudS5maW5kKCdbZGF0YS10YXJnZXRwYW5lbF0nKS5lYWNoKCBmdW5jdGlvbihpbmRleCwgdHJpZ2dlcikge1xuICAgICAgICAgICAgICAgIHZhciAkdHJpZ2dlciA9JCh0cmlnZ2VyKTtcbiAgICAgICAgICAgICAgICAkdHJpZ2dlci5jbGljayggZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgYmFzZS5fdHJpZ2dlcignc2hvd3BhbmVsJywgZXZlbnQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbmVsOiAkKCcjJyArICR0cmlnZ2VyLmRhdGEoJ3RhcmdldHBhbmVsJykpLmZpcnN0KCksXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWRnZXQ6IGJhc2VcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gYXR0YWNoIGhhbmRsZXJzIHRvIHRoZSBwYWdlIHN3aXRjaGVyc1xuICAgICAgICAgICAgdGhpcy5wYW5lbHMuZWFjaCggZnVuY3Rpb24oaW5kZXgsIHBhbmVsKSB7XG4gICAgICAgICAgICAgICAgdmFyICRwYW5lbCA9ICQocGFuZWwpO1xuICAgICAgICAgICAgICAgICRwYW5lbC5maW5kKCdbZGF0YS10YXJnZXRwYWdlXScpLmNsaWNrKCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBiYXNlLl90cmlnZ2VyKCdzaG93cGFnZScsIGV2ZW50LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYW5lbDogJHBhbmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFnZTogJCgnIycgKyAkKHRoaXMpLmRhdGEoJ3RhcmdldHBhZ2UnKSksXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWRnZXQ6IGJhc2VcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gYWN0aXZhdGUgdGhlIGN1cnJlbnQgbWVudXMsIHBhbmVscyBldGNcbiAgICAgICAgICAgIHZhciAkY3VycmVudE1haW4gPSB0aGlzLm1haW5NZW51SXRlbXMuZmlsdGVyKCcuJyArIG9wdHMuYWN0aXZlQ2xhc3MpO1xuICAgICAgICAgICAgJGN1cnJlbnRNYWluLnJlbW92ZUNsYXNzKG9wdHMuYWN0aXZlQ2xhc3MpLmNoaWxkcmVuKCdhJykuY2xpY2soKTtcblxuICAgICAgICAgICAgLy8gZmluYWxseSwgZmFkZSBiYWNrIGluXG4gICAgICAgICAgICAkbWVudS5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAnZmFzdCcpO1xuXG4gICAgICAgICAgICAvLyBwYW5lbHMgc3RheSBpbnZpc2libGVcbiAgICAgICAgfSxcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBfc3dpdGNoQ2xhc3NPcHRpb246IGZ1bmN0aW9uKGNsYXNzTmFtZSwgbmV3Q2xhc3MpIHtcbiAgICAgICAgICAgIHZhciBvbGRDbGFzcyA9IHRoaXMub3B0aW9uc1tjbGFzc05hbWVdO1xuICAgICAgICAgICAgaWYgKG9sZENsYXNzICE9PSBuZXdDbGFzcykge1xuICAgICAgICAgICAgICAgIHZhciBncm91cCA9IHRoaXMuZWxlbWVudC5maW5kKCcuJyArIG9sZENsYXNzKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNbY2xhc3NOYW1lXSA9IG5ld0NsYXNzO1xuICAgICAgICAgICAgICAgIGdyb3VwLnJlbW92ZUNsYXNzKG9sZENsYXNzKTtcbiAgICAgICAgICAgICAgICBncm91cC5hZGRDbGFzcyhuZXdDbGFzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gUmVzcG9uZCB0byBhbnkgY2hhbmdlcyB0aGUgdXNlciBtYWtlcyB0byB0aGVcbiAgICAgICAgLy8gb3B0aW9uIG1ldGhvZFxuICAgICAgICBfc2V0T3B0aW9uOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJtYWluTWVudUNsYXNzXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcImNsZWFyZml4Q2xhc3NcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiYWN0aXZlQ2xhc3NcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3dpdGNoQ2xhc3NPcHRpb24oa2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gaXQncyBva2F5IHRoYXQgdGhlcmUncyBubyB9IGhlcmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHJlbWVtYmVyIHRvIGNhbGwgb3VyIHN1cGVyJ3MgX3NldE9wdGlvbiBtZXRob2RcbiAgICAgICAgICAgIHRoaXMuX3N1cGVyKCBcIl9zZXRPcHRpb25cIiwga2V5LCB2YWx1ZSApO1xuICAgICAgICB9LFxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vIERlc3Ryb3kgYW4gaW5zdGFudGlhdGVkIHBsdWdpbiBhbmQgY2xlYW4gdXBcbiAgICAgICAgLy8gbW9kaWZpY2F0aW9ucyB0aGUgd2lkZ2V0IGhhcyBtYWRlIHRvIHRoZSBET01cbiAgICAgICAgX2Rlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5tYWluTWVudUNsYXNzKTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuY2xlYXJmaXhDbGFzcyk7XG4gICAgICAgICAgICB0aGlzLnBhbmVscy5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuY2xlYXJmaXhDbGFzcyk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gZG8gdGhlIGxheW91dCBjYWxjdWxhdGlvbnNcbiAgICAgICAgX2xheW91dE1lbnU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gZ28gdGhyb3VnaCBlYWNoIHN1Ym1lbnUgYW5kIHJlY29yZCBpdHMgd2lkdGhcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5maW5kKCd1bCcpLmVhY2goIGZ1bmN0aW9uKGluZGV4LCBzdWJNZW51KSB7XG4gICAgICAgICAgICAgICAgdmFyICRzbSA9ICQoc3ViTWVudSk7XG4gICAgICAgICAgICAgICAgJHNtLmNzcyh7d2lkdGg6ICdhdXRvJ30pO1xuICAgICAgICAgICAgICAgICRzbS5kYXRhKCdvcmlnaW5hbFdpZHRoJywgJHNtLndpZHRoKCkpO1xuXG4gICAgICAgICAgICAgICAgLy8gbGVhdmUgZWFjaCBzdWJtZW51IGhpZGRlbiwgd2l0aCB3aWR0aCAwXG4gICAgICAgICAgICAgICAgJHNtLmNzcyh7IHdpZHRoOiAwLCBkaXNwbGF5OiAnbm9uZScgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBfc2hvd01lbnU6IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgICAgICB2YXIgJGl0ZW0gPSAkKGRhdGEubWVudWl0ZW0pO1xuICAgICAgICAgICAgdmFyIGJhc2UgPSBkYXRhLndpZGdldDtcbiAgICAgICAgICAgIC8vICRpdGVtIGlzIGEgY2xpY2tlZC1vbiBtZW51IGl0ZW0uLlxuICAgICAgICAgICAgaWYgKCRpdGVtLmhhc0NsYXNzKGJhc2Uub3B0aW9ucy5hY3RpdmVDbGFzcykpIHtcbiAgICAgICAgICAgICAgICAvLyA/P1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBiYXNlLl9oaWRlUGFuZWxzKCk7XG4gICAgICAgICAgICAgICAgYmFzZS5tYWluTWVudUl0ZW1zLnJlbW92ZUNsYXNzKGJhc2Uub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgICAgICAgICAgICAgdmFyICRuZXdTdWJNZW51ID0gJGl0ZW0uZmluZCgndWwnKTtcbiAgICAgICAgICAgICAgICB2YXIgJG9sZFN1Yk1lbnVzID0gYmFzZS5lbGVtZW50LmZpbmQoJ3VsJykubm90KCRuZXdTdWJNZW51KTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3V2lkdGggPSAkbmV3U3ViTWVudS5kYXRhKCdvcmlnaW5hbFdpZHRoJyk7XG5cbiAgICAgICAgICAgICAgICAkb2xkU3ViTWVudXMuYW5pbWF0ZSh7IHdpZHRoOiAwIH0sICg1MCAqIGJhc2Uub3B0aW9ucy5hbmltYXRpb25GYWN0b3IpLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgJG9sZFN1Yk1lbnVzLmNzcyh7IGRpc3BsYXk6ICdub25lJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAkaXRlbS5hZGRDbGFzcyhiYXNlLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xuICAgICAgICAgICAgICAgICRuZXdTdWJNZW51XG4gICAgICAgICAgICAgICAgICAgIC5jc3Moe2Rpc3BsYXk6ICdibG9jaycgfSlcbiAgICAgICAgICAgICAgICAgICAgLmFuaW1hdGUoeyB3aWR0aDogbmV3V2lkdGggfSwgKDEyNSAqIGJhc2Uub3B0aW9ucy5hbmltYXRpb25GYWN0b3IpLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRuZXdTdWJNZW51LmNzcyh7IHdpZHRoOiAnYXV0bycgfSkucmVtb3ZlQXR0cignc3R5bGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhc2UuX3RyaWdnZXIoJ21lbnVzaG93bicsIGV2ZW50LCB7IGl0ZW06ICRpdGVtLCB3aWRnZXQ6IGJhc2UgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBuZXcgc3VibWVudSBoYXMgYW4gYWN0aXZlIGl0ZW0sIGNsaWNrIGl0XG4gICAgICAgICAgICAgICAgJG5ld1N1Yk1lbnUuZmluZCgnLicgKyBiYXNlLm9wdGlvbnMuYWN0aXZlQ2xhc3MgKyAnIGEnKS5jbGljaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIF9zaG93U3ViTWVudTogZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgICAgIC8vIGRlLWFjdGl2ZWlmeSBhbGwgdGhlIHN1Ym1lbnUgaXRlbXNcbiAgICAgICAgICAgICQoZGF0YS5tZW51aXRlbSkuZmluZCgnbGknKS5yZW1vdmVDbGFzcyhkYXRhLndpZGdldC5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICAgICAgICAgIC8vIGFjdGl2ZS1pZnkgdGhlIG9uZSB0cnVlIHN1Ym1lbnUgaXRlbVxuICAgICAgICAgICAgJChkYXRhLnN1Ym1lbnVpdGVtKS5hZGRDbGFzcyhkYXRhLndpZGdldC5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyBkbyB0aGUgbGF5b3V0IGNhbGN1bGF0aW9uc1xuICAgICAgICBfbGF5b3V0UGFuZWxzOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgdmFyICRwYWdlcyA9IHRoaXMucGFuZWxzLmZpbmQoJy4nICsgdGhpcy5vcHRpb25zLnBhZ2VDbGFzcyk7XG5cbiAgICAgICAgICAgIC8vIGdvIHRocm91Z2ggZWFjaCBwYWdlIGFuZCByZWNvcmQgaXRzIGhlaWdodFxuICAgICAgICAgICAgJHBhZ2VzLmVhY2goIGZ1bmN0aW9uKGluZGV4LCBwYWdlKSB7XG4gICAgICAgICAgICAgICAgdmFyICRwYWdlID0gJChwYWdlKTtcbiAgICAgICAgICAgICAgICAkcGFnZS5jc3Moe2hlaWdodDogJ2F1dG8nfSk7XG4gICAgICAgICAgICAgICAgJHBhZ2UuZGF0YSgnb3JpZ2luYWxIZWlnaHQnLCAkcGFnZS5vdXRlckhlaWdodCgpKTtcblxuICAgICAgICAgICAgICAgIC8vIGxlYXZlIGVhY2ggcGFnZSBoaWRkZW4sIHdpdGggaGVpZ2h0IDBcbiAgICAgICAgICAgICAgICAkcGFnZS5jc3MoeyBoZWlnaHQ6IDAsIGRpc3BsYXk6ICdub25lJyB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBnbyB0aHJvdWdoIGVhY2ggcGFuZWwgYW5kIGhpZGUgaXRcbiAgICAgICAgICAgIHRoaXMucGFuZWxzLmVhY2goIGZ1bmN0aW9uKGluZGV4LCBwYW5lbCkge1xuICAgICAgICAgICAgICAgIHZhciAkcGFuZWwgPSAkKHBhbmVsKTtcbiAgICAgICAgICAgICAgICAkcGFuZWwuY3NzKHsgZGlzcGxheTogJ25vbmUnIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgX2hpZGVQYW5lbHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5wYW5lbHMucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKS5jc3MoeyBkaXNwbGF5OiAnbm9uZScsIGhlaWdodDogMCB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBfc2hvd1BhbmVsOiBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICAgICAgICAgICAgdmFyICRwYW5lbCA9ICQoZGF0YS5wYW5lbCk7XG4gICAgICAgICAgICB2YXIgYmFzZSA9IGRhdGEud2lkZ2V0O1xuICAgICAgICAgICAgLy8gJHBhbmVsIGlzIGEgcGFuZWwgdG8gc2hvdy4uXG4gICAgICAgICAgICBpZiAoJHBhbmVsLmhhc0NsYXNzKGJhc2Uub3B0aW9ucy5hY3RpdmVDbGFzcykpIHtcbiAgICAgICAgICAgICAgICAvLyA/P1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBiYXNlLl9oaWRlUGFuZWxzKCk7XG4gICAgICAgICAgICAgICAgJHBhbmVsLmFkZENsYXNzKGJhc2Uub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgICAgICAgICAgICAgJHBhbmVsLmNzcyh7IGRpc3BsYXk6ICdibG9jaycsIG9wYWNpdHk6IDEgfSk7XG4gICAgICAgICAgICAgICAgdmFyICRwYWdlID0gJCgkcGFuZWwuZmluZCgnLicgKyBiYXNlLm9wdGlvbnMucGFnZUNsYXNzICsgJy4nICsgYmFzZS5vcHRpb25zLmFjdGl2ZUNsYXNzKSk7XG4gICAgICAgICAgICAgICAgYmFzZS5fdHJpZ2dlcignc2hvd3BhZ2UnLCBldmVudCwgeyBwYW5lbDogJHBhbmVsLCBwYWdlOiAkcGFnZSwgd2lkZ2V0OiBiYXNlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIF9zaG93UGFnZTogZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBiYXNlID0gZGF0YS53aWRnZXQ7XG4gICAgICAgICAgICB2YXIgJHBhbmVsID0gJChkYXRhLnBhbmVsKTtcbiAgICAgICAgICAgIHZhciAkcGFnZSA9ICQoZGF0YS5wYWdlKTtcbiAgICAgICAgICAgIHZhciBuZXdIZWlnaHQgPSAkcGFnZS5kYXRhKCdvcmlnaW5hbEhlaWdodCcpO1xuXG4gICAgICAgICAgICAvLyBmaXggdGhlIHBhbmVsJ3MgY3VycmVudCBoZWlnaHRcbiAgICAgICAgICAgICRwYW5lbC5jc3Moe2hlaWdodDogJHBhbmVsLmhlaWdodCgpIH0pO1xuXG4gICAgICAgICAgICAvLyBkZWFsIHdpdGggdGhlIHBhZ2UgY3VycmVudGx5IGJlaW5nIGRpc3BsYXllZFxuICAgICAgICAgICAgdmFyICRvbGRQYWdlID0gJHBhbmVsLmZpbmQoJy4nICsgYmFzZS5vcHRpb25zLnBhZ2VDbGFzcyArICcuJyArIGJhc2Uub3B0aW9ucy5hY3RpdmVDbGFzcykubm90KCRwYWdlKTtcbiAgICAgICAgICAgIGlmICgkb2xkUGFnZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgJG9sZFBhZ2UuZGF0YSgnb3JpZ2luYWxIZWlnaHQnLCAkb2xkUGFnZS5vdXRlckhlaWdodCgpKTtcbiAgICAgICAgICAgICAgICAkb2xkUGFnZS5yZW1vdmVDbGFzcyhiYXNlLm9wdGlvbnMuYWN0aXZlQ2xhc3MpLmZhZGVPdXQoKDUwICogYmFzZS5vcHRpb25zLmFuaW1hdGlvbkZhY3RvciksIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAkb2xkUGFnZS5jc3MoeyBoZWlnaHQ6IDAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHN3aXRjaCBvbiB0aGUgbmV3IHBhZ2UgYW5kIGdyb3cgdGhlIG9wYW5lbCB0byBob2xkIGl0XG4gICAgICAgICAgICAkcGFnZS5jc3MoeyBoZWlnaHQ6ICdhdXRvJyB9KS5hZGRDbGFzcyhiYXNlLm9wdGlvbnMuYWN0aXZlQ2xhc3MpLmZhZGVJbigoMTAwICogYmFzZS5vcHRpb25zLmFuaW1hdGlvbkZhY3RvciksIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRwYWdlLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBhbmltVGltZSA9ICgkb2xkUGFnZS5sZW5ndGggPiAwID8gKDEwMCAqIGJhc2Uub3B0aW9ucy5hbmltYXRpb25GYWN0b3IpIDogKDE1MCAqIGJhc2Uub3B0aW9ucy5hbmltYXRpb25GYWN0b3IpKTsgLy8gYW5pbWF0ZSBmYXN0ZXIgaWYgaXQncyBzd2l0Y2hpbmcgcGFnZXNcbiAgICAgICAgICAgICRwYW5lbC5hbmltYXRlKHsgaGVpZ2h0OiBuZXdIZWlnaHQgfSwgYW5pbVRpbWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRwYW5lbC5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSxcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBfOiBudWxsIC8vIG5vIGZvbGxvd2luZyBjb21tYVxuICAgIH0pO1xuXG59KShqUXVlcnksIHdpbmRvdywgZG9jdW1lbnQpO1xuXG5cblxuXG5cblxuXG5cblxuXG5cblxuIl19