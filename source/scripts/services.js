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
