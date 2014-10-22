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
      { 
        apiKey: apiKey 
      }, 
      {
        get: { method: 'GET', params: {'fo': 1}, cache: 1},
        // query: { method: 'GET', params: {'l': 12, 'f': {'lyrics': 0}}, isArray: 1, cache: 1 },
        query: { method: 'GET', params: {'l': 12}, isArray: 1, cache: 1 },
        update: { method: 'PUT' }
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
