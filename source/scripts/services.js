'use strict';

// Services

var services = angular.module('services', ['ngResource']);

services.factory('Page', [
  function() {
    var title = 'llllyrics';
    return {
      title: function() { return title; },
      setTitle: function(newTitle) { title = newTitle; }
    }
  }]);

var dbUrl = 'https://api.mongolab.com/api/1/databases/lyrics/collections';
var apiKey = 'JVmmdZYza2puepYKIJWfgvgYAzP8nAZm';

// https://api.mongolab.com/api/1/databases/lyrics/collections/lyrics?apiKey=JVmmdZYza2puepYKIJWfgvgYAzP8nAZm
// https://api.mongolab.com/api/1/databases/lyrics/collections/lyrics?apiKey=JVmmdZYza2puepYKIJWfgvgYAzP8nAZm&q={%22artist%22:%22HAIM%22}

services.factory('Song', ['$resource',
  function($resource) {
    var Song = $resource(dbUrl + '/lyrics/:id',
      { apiKey: apiKey }, 
      {
        update: { method: 'PUT' },
        query: { method: 'GET', params: {'l': 12}, isArray: true, cache: true }
      }
    );

    Song.prototype.update = function(cb) {
      return Song.update({id: this._id.$oid},
      angular.extend({}, this, {_id:undefined}), cb);
    };

    Song.prototype.destroy = function(cb) {
      return Song.remove({id: this._id.$oid}, cb);
    };

    return Song;
  }]);
