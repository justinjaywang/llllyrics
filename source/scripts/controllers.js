'use strict';

// Controllers

var controllers = angular.module('controllers', []);

// controllers.controller('EmptyCtrl', ['$scope',
//   function($scope) {
//   }]);

controllers.controller('TitleCtrl', ['$scope', '$location', '$timeout', 'Page',
  function($scope, $location, $timeout, Page) {
    $scope.Page = Page;
    // $scope.parameters = {};
    // $scope.$on('$routeChangeStart', function(event, next, current) {
    //   if (typeof next === 'undefined') return;
    //   if (typeof current === 'undefined') return;
    //   if (next.templateUrl == current.loadedTemplateUrl) return; // same template, no need to reset params
    //   $scope.parameters.resetParameters();
    // });
    // $scope.$on('$routeChangeSuccess', function(event, next, current) {
    //   $scope.parameters.closeNav();
    // });
  }]);

controllers.controller('SearchCtrl', ['$scope', '$location', 'Page',
  function($scope, $location, Page) {
    Page.setTitle('llllyrics / Search');
  }]);

controllers.controller('ViewCtrl', ['$scope', '$location', 'Page',
  function($scope, $location, Page) {
    Page.setTitle('llllyrics / View');
  }]);

controllers.controller('AddCtrl', ['$scope', '$location', 'Page',
  function($scope, $location, Page) {
    Page.setTitle('llllyrics / Add');
  }]);

controllers.controller('EditCtrl', ['$scope', '$location', 'Page',
  function($scope, $location, Page) {
    Page.setTitle('llllyrics / Edit');
  }]);

controllers.controller('AboutCtrl', ['$scope', '$location', 'Page',
  function($scope, $location, Page) {
    Page.setTitle('llllyrics / About');
  }]);
