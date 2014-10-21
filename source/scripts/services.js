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

services.factory('Songs', ['$resource',
  function($resource) {
    var Songs = $resource(dbUrl + '/lyrics/:id',
      { apiKey: apiKey }, {
        update: { method: 'PUT' }
      }
    );

    Songs.prototype.update = function(cb) {
      return Song.update({id: this._id.$oid},
      angular.extend({}, this, {_id:undefined}), cb);
    };

    Songs.prototype.destroy = function(cb) {
      return Song.remove({id: this._id.$oid}, cb);
    };

    return Songs;
  }]);
