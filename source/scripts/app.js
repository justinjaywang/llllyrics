'use strict';

// App Module

var llllyricsApp = angular.module('llllyricsApp', [
  'ngRoute',
  'ngAnimate',
  'controllers',
  'directives',
  'filters',
  'services',
  ]);

llllyricsApp.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
      .when('/', {
        templateUrl: 'views/search.html',
        controller: 'SearchCtrl'
      })
      .when('/view/:songId', {
        templateUrl: 'views/view.html',
        controller: 'ViewCtrl'
      })
      .when('/edit/:songId', {
        templateUrl: 'views/edit.html',
        controller: 'EditCtrl'
      })
      .when('/add', {
        templateUrl: 'views/edit.html',
        controller: 'AddCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);
