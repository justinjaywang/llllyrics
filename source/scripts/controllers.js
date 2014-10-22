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

controllers.controller('SearchCtrl', ['$scope', '$location', 'Page', 'Song',
  function($scope, $location, Page, Song) {
    // $scope.songs = Song.query();
    Song.query(function(songs) {
      $scope.songs = songs;
    }, function(err) {
      console.log('error in query :(');
    });
    // Song.query().$promise.then(function(songs) {
    //   $scope.songs = songs;
    //   // $scope.updateUrl = function() {
    //   //   var path = $location.path();
    //   //   $location.url(path + '?q=' + $scope.searchQuery);
    //   // };
    //   // $scope.$watch(function() { return $location.url(); }, function(url) {
    //   //   if (url) {
    //   //     $scope.searchQuery = $location.updateUrl().q
    //   //     $scope.updateUrl();
    //   //   }
    //   // });
    // });
    Page.setTitle('llllyrics / search'); // TEMP
  }]);

controllers.controller('ViewCtrl', ['$scope', '$location', '$routeParams', 'Page', 'Song',
  function($scope, $location, $routeParams, Page, Song) {
    Song.get({id: $routeParams.songId}, function(song){
      $scope.song = song;
      Page.setTitle('"' + song.song + '" by ' + song.artist);    
    }, function(err){
      Page.setTitle('llllyrics / ' + err.status);
      $scope.errorId = $routeParams.songId;
    });
  }]);

controllers.controller('AddCtrl', ['$scope', '$location', 'Page', 'Song',
  function($scope, $location, Page, Song) {
    $scope.songs = Song.query();
    $scope.save = function() {
      Song.save($scope.songs, function(song) {
        $location.path('/view/' + song._id.$oid);
      });
    }
    Page.setTitle('llllyrics / add');
  }]);

controllers.controller('EditCtrl', ['$scope', '$location', '$routeParams', 'Page', 'Song',
  function($scope, $location, $routeParams, Page, Song) {
    $scope.songs = Song.query();
    var self = this;

    Song.get({id: $routeParams.songId}, function(song) {
      self.original = song;
      $scope.song = new Song(self.original);
      Page.setTitle('llllyrics / edit "' + song.song + '" by ' + song.artist);
    }, function(err){
      Page.setTitle('llllyrics / ' + err.status);
      $scope.errorId = $routeParams.songId;
    });
    
    $scope.isClean = function() {
      return angular.equals(self.original, $scope.song);
    }
    $scope.destroy = function() {
      self.original.destroy(function() {
        $location.path('/');
      });
    }
    $scope.save = function() {
      $scope.song.update(function(song) {
        $location.path('/view/' + song._id.$oid);
      });
    }
  }]);

controllers.controller('AboutCtrl', ['$scope', '$location', 'Page',
  function($scope, $location, Page) {
    Page.setTitle('llllyrics / about');
  }]);
