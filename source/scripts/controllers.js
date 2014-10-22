'use strict';

// Controllers

var controllers = angular.module('controllers', []);

// controllers.controller('EmptyCtrl', [
//   '$scope',
//   function($scope) {
//   }]);

controllers.controller('TitleCtrl', [
  '$scope',
  '$location',
  '$timeout',
  'Page',
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

controllers.controller('SearchCtrl', [
  '$scope',
  '$location',
  'Page',
  'Song',
  function($scope, $location, Page, Song) {
    // define helper functions
    $scope.changeSearchType = function(type) {
      $scope.searchType = type;
      console.log('searchType: ' + type); // TEMP
    };

    // define regular expressions
    var regexes = {};
    regexes.artist = /^(artist|a):/i;
    regexes.album = /^(album|b):/i;
    regexes.song = /^(song|s):/i;
    regexes.lyrics = /^(lyrics|l):/i;

    // define search type strings
    $scope.searchTypes = {};
    $scope.searchTypes.all = '$';
    $scope.searchTypes.artist = 'artist';
    $scope.searchTypes.album = 'album';
    $scope.searchTypes.song = 'song';
    $scope.searchTypes.lyrics = 'lyrics';

    // instantiate search type
    $scope.changeSearchType('$');

    // query database
    Song.query(function(songs) {
      console.log('successful query'); // TEMP
      $scope.songs = songs;
    }, function(err) {
      console.log('query failed'); // TEMP
    });

    // other functions
    $scope.updateResults = function() {
      console.log('\n')
      // console.log($scope.searchInput);
      if (angular.isUndefined($scope.searchInput)) {
        console.log('$scope.q undefined'); // TEMP
        return;
      }
      var searchInput = $scope.searchInput;
      // console.log(q); // TEMP
      if (searchInput === '') {
        // empty search
        // $scope.songs = [];
        $scope.changeSearchType($scope.searchTypes.all);
      } else if (searchInput.match(regexes.artist)) {
        // artist search
        // console.log('artist search');
        $scope.changeSearchType($scope.searchTypes.artist);
      } else if (searchInput.match(regexes.album)) {
        // album search
        // console.log('album search');
        $scope.changeSearchType($scope.searchTypes.album);

      } else if (searchInput.match(regexes.song)) {
        // song title search
        // console.log('song search');
        $scope.changeSearchType($scope.searchTypes.song);

      } else if (searchInput.match(regexes.lyrics)) {
        // lyrics search
        // console.log('lyrics search');
        $scope.changeSearchType($scope.searchTypes.lyrics);
      } else {
        // regular search
        $scope.changeSearchType($scope.searchTypes.all);
      }
    };
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

    // filter helper functions
    $scope.formatInput = function(searchInput, searchType) {
      switch(searchType) {
        case $scope.searchTypes.all:
          return angular.lowercase(searchInput);
          break;
        case $scope.searchTypes.artist:
          return angular.lowercase(searchInput);
          break;
        case $scope.searchTypes.album:
          return angular.lowercase(searchInput);
          break;
        case $scope.searchTypes.song:
          return angular.lowercase(searchInput);
          break;
        case $scope.searchTypes.lyrics:
          return angular.lowercase(searchInput);
          break;
        default:
          return angular.lowercase(searchInput);
      }
    };
    $scope.formatData = function(data) {
      return angular.lowercase(data);
    };
    $scope.isMatch = function(data, q) {
      return data.match(q);
    };

    // filter functions
    $scope.filterSearch = function(searchInput, searchType) {
      var q = $scope.formatInput(searchInput, searchType);
      return function(song) {
        var artistData = $scope.formatData(song.artist);
        var albumData = $scope.formatData(song.album);
        var songData = $scope.formatData(song.song);
        var lyricsData = $scope.formatData(song.lyrics);
        return $scope.isMatch(artistData, q) || $scope.isMatch(albumData, q) || $scope.isMatch(songData, q) || $scope.isMatch(lyricsData, q);
      };
    };
    
    // set search page title
    Page.setTitle('llllyrics / search'); // TEMP
  }]);

controllers.controller('ViewCtrl', [
  '$scope',
  '$location',
  '$routeParams',
  'Page',
  'Song',
  function($scope, $location, $routeParams, Page, Song) {
    Song.get({id: $routeParams.songId}, function(song){
      $scope.song = song;
      Page.setTitle('"' + song.song + '" by ' + song.artist);    
    }, function(err){
      $scope.errorId = $routeParams.songId;
      Page.setTitle('llllyrics / ' + err.status);
    });
  }]);

controllers.controller('AddCtrl', [
  '$scope',
  '$location',
  'Page',
  'Song',
  function($scope, $location, Page, Song) {
    $scope.songs = Song.query();
    $scope.save = function() {
      Song.save($scope.songs, function(song) {
        $location.path('/view/' + song._id.$oid);
      });
    }
    Page.setTitle('llllyrics / add');
  }]);

controllers.controller('EditCtrl', [
  '$scope',
  '$location',
  '$routeParams',
  'Page',
  'Song',
  function($scope, $location, $routeParams, Page, Song) {
    $scope.songs = Song.query();
    var self = this;

    Song.get({id: $routeParams.songId}, function(song) {
      self.original = song;
      $scope.song = new Song(self.original);
      Page.setTitle('llllyrics / edit "' + song.song + '" by ' + song.artist);
    }, function(err){
      $scope.errorId = $routeParams.songId;
      Page.setTitle('llllyrics / ' + err.status);
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

controllers.controller('AboutCtrl', [
  '$scope',
  '$location',
  'Page',
  function($scope, $location, Page) {
    Page.setTitle('llllyrics / about');
  }]);
