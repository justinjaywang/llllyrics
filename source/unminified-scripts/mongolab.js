// This is a module for cloud persistance in mongolab - https://mongolab.com
angular.module('mongolab', ['ngResource']).
  factory('Song', function($resource) {
    var Song = $resource('https://api.mongolab.com/api/1/databases' +
      '/lyrics/collections/lyrics/:id',
      { apiKey: 'JVmmdZYza2puepYKIJWfgvgYAzP8nAZm' }, {
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
  });
