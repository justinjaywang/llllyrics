'use strict';

// App Module

var llllyrics = angular.module('llllyrics', [
  'ngRoute',
  'ngAnimate',
  'controllers',
  'directives',
  'filters',
  'services',
  ]);

llllyrics.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
      .when('/', {
        templateUrl: 'views/search.html',
        controller: 'SearchCtrl'
      })
      .when('/add', {
        templateUrl: 'views/edit.html',
        controller: 'AddCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/:songId', {
        templateUrl: 'views/view.html',
        controller: 'ViewCtrl'
      })
      .when('/:songId/edit', {
        templateUrl: 'views/edit.html',
        controller: 'EditCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);
