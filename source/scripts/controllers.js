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
  '$route',
  '$timeout',
  'Page',
  function($scope, $location, $route, $timeout, Page) {
    $scope.Page = Page;
    $scope.isActiveCtrl = function(controller) {
      var current = $route.current;
      if (angular.isUndefined(current)) return;
      return (current.controller == controller);
    };
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
      // console.log('searchType: ' + type); // TEMP
    };

    // define regular expressions
    var regexes = {};
    regexes.artist = /^(artist|a):/i;
    regexes.album = /^(album|b):/i;
    regexes.song = /^(song|s):/i;
    regexes.lyrics = /^(lyrics|l):/i;
    regexes.multispace = / +/g;
    regexes.prespace = /^ /; // TEMP
    regexes.postspace = / $/; // TEMP
    regexes.newline = /\n/g;
    regexes.symbols = /[^a-z0-9 ]/g;

    // define search type strings
    $scope.searchTypes = {};
    $scope.searchTypes.all = '$';
    $scope.searchTypes.artist = 'artist';
    $scope.searchTypes.album = 'album';
    $scope.searchTypes.song = 'song';
    $scope.searchTypes.lyrics = 'lyrics';

    // instantiate search type
    $scope.changeSearchType('$');

    // limit variable
    $scope.resultLimit = 12;

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
        $scope.changeSearchType($scope.searchTypes.all); // TO DO: change to empty, show something else
      } else if (searchInput.match(regexes.artist)) {
        // artist search
        $scope.changeSearchType($scope.searchTypes.artist);
      } else if (searchInput.match(regexes.album)) {
        // album search
        $scope.changeSearchType($scope.searchTypes.album);

      } else if (searchInput.match(regexes.song)) {
        // song title search
        $scope.changeSearchType($scope.searchTypes.song);

      } else if (searchInput.match(regexes.lyrics)) {
        // lyrics search
        $scope.changeSearchType($scope.searchTypes.lyrics);
      } else {
        // all search
        $scope.changeSearchType($scope.searchTypes.all);
      }
    };

    // filter helper functions
    var formatInput = function(searchInput, searchType) {
      if (angular.isUndefined(searchInput)) return;
      var preformatInput = function(searchInput) {
        return angular.lowercase(searchInput);
      };
      var postformatInput = function(q) {
        return q
          .replace(regexes.multispace, ' ')
          .replace(regexes.prespace, '')
          .replace(regexes.postspace, '')
          .replace(regexes.symbols, '');
      };
      var q = preformatInput(searchInput);
      switch(searchType) {
        case $scope.searchTypes.all:
          return postformatInput(q);
          break;
        case $scope.searchTypes.artist:
          return postformatInput(q.replace(regexes.artist, ''));
          break;
        case $scope.searchTypes.album:
          return postformatInput(q.replace(regexes.album, ''));
          break;
        case $scope.searchTypes.song:
          return postformatInput(q.replace(regexes.song, ''));
          break;
        case $scope.searchTypes.lyrics:
          return postformatInput(q.replace(regexes.lyrics, ''));
          break;
        default:
          return postformatInput(q);
      }
    };
    var formatData = function(data) {
      if (angular.isUndefined(data)) {
        return angular.lowercase(data);
      } else {
        return angular.lowercase(data)
          .replace(regexes.newline, ' ')
          .replace(regexes.multispace, ' ')
          .replace(regexes.symbols, '');
      }
    };
    var isMatchByType = function(song, q, searchType) {
      var artistData = formatData(song.artist);
      var albumData = formatData(song.album);
      var songData = formatData(song.song);
      var lyricsData = formatData(song.lyrics);
      switch (searchType) {
        case $scope.searchTypes.all:
          return isMatch(artistData, q) || isMatch(albumData, q) || isMatch(songData, q) || isMatch(lyricsData, q);
          break;
        case $scope.searchTypes.artist:
          return isMatch(artistData, q);
          break;
        case $scope.searchTypes.album:
          return isMatch(albumData, q);
          break;
        case $scope.searchTypes.song:
          return isMatch(songData, q);
          break;
        case $scope.searchTypes.lyrics:
          return isMatch(lyricsData, q);
          break;
        default:
          console.log('default isMatchByType'); // TEMP
          return false;
      }
    }
    var isMatch = function(data, q) {
      // TO DO: make this per word basis
      if (angular.isUndefined(data)) {
        return false;
      } else {
        return data.match(q);
      }
    };

    // the filter function
    $scope.filterSearch = function(searchInput, searchType) {
      // console.log('filter search called'); // TEMP this checks how many times it gets called
      var q = formatInput(searchInput, searchType);
      return function(song) {
        return isMatchByType(song, q, searchType);
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
    Song.get({id: $routeParams.songId}, function(song) {
      $scope.song = song;
      Page.setTitle('"' + song.song + '" by ' + song.artist);    
    }, function(err) {
      $scope.errorId = $routeParams.songId;
      Page.setTitle('llllyrics / ' + err.status);
      console.log('get failed'); // TEMP
      console.log(err);
    });
  }]);

controllers.controller('AddCtrl', [
  '$scope',
  '$location',
  'Page',
  'Song',
  function($scope, $location, Page, Song) {
    // $scope.songs = Song.query();
    $scope.save = function() {
      Song.save($scope.song, function(song) {
        $location.path('/view/' + song._id.$oid);
      }, function(err) {
        console.log('add save failed'); // TEMP
        console.log(err);
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
    // $scope.songs = Song.query();
    // var self = this;

    // Song.get({id: $routeParams.songId}, function(song) {
    //   self.original = song;
    //   $scope.song = new Song(self.original);
    //   Page.setTitle('llllyrics / edit "' + song.song + '" by ' + song.artist);
    // }, function(err){
    //   $scope.errorId = $routeParams.songId;
    //   Page.setTitle('llllyrics / ' + err.status);
    // });

    Song.get({id: $routeParams.songId}, function(song){
      $scope.song = song;
    }, function(err){
      console.log('get failed'); // TEMP
      console.log(err);
    });
    
    $scope.destroy = function() {
      $scope.song.destroy(function() {
        $location.path('/');
      });
    }
    $scope.save = function() {
      $scope.song.update(function(song) {
        $location.path('/view/' + song._id.$oid);
      }, function(err) {
        console.log('edit save failed'); // TEMP
        console.log(err);
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
