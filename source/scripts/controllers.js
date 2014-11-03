'use strict';

// Controllers

var controllers = angular.module('controllers', []);

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
    };
    $scope.parseSearchType = function() {
      // updates searchType based on prefixes
      if (angular.isUndefined($scope.q)) {
        console.log('$scope.q undefined in changeSearchType'); // TEMP
        return;
      }
      var q = $scope.q;
      if (q === '') {
        // empty search
        $scope.changeSearchType($scope.searchTypes.all); // TO DO: change to empty, show something else
      } else if (q.match(regexes.artist)) {
        // artist search
        $scope.changeSearchType($scope.searchTypes.artist);
      } else if (q.match(regexes.album)) {
        // album search
        $scope.changeSearchType($scope.searchTypes.album);

      } else if (q.match(regexes.song)) {
        // song title search
        $scope.changeSearchType($scope.searchTypes.song);

      } else if (q.match(regexes.lyrics)) {
        // lyrics search
        $scope.changeSearchType($scope.searchTypes.lyrics);
      } else {
        // all search
        $scope.changeSearchType($scope.searchTypes.all);
      }
    };
    // define all variables
    // : define regular expressions
    var regexes = {};
    regexes.artist = /^(artist|a):/i;
    regexes.album = /^(album|b):/i;
    regexes.song = /^(song|s):/i;
    regexes.lyrics = /^(lyrics|l):/i;
    regexes.multispace = / +/g;
    regexes.prespace = /^ /;
    regexes.postspace = / $/;
    regexes.newline = /\n/g;
    regexes.symbols = /[^a-z0-9" ]/g;
    regexes.prequote = /^"/;
    regexes.postquote = /"$/;
    regexes.splitBySpace = /"([^"]+)"|([^ ]+)/g; // split by space not in double quotes
    // : define search type strings
    $scope.searchTypes = {};
    $scope.searchTypes.all = '$';
    $scope.searchTypes.artist = 'artist';
    $scope.searchTypes.album = 'album';
    $scope.searchTypes.song = 'song';
    $scope.searchTypes.lyrics = 'lyrics';
    // : instantiate search type
    $scope.changeSearchType('$');
    // : limit variable
    $scope.resultLimit = 12;

    // filterSearch helper functions
    var formatInput = function(searchInput, searchType) {
      // returns input, lowercased and with special characters removed
      // if prefixed, remove prefixes also
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
    var formatInputToArray = function(qString) {
      // returns array from space-delimited string,
      // keeping spaces between double quotes
      var qArray = (angular.isUndefined(qString) || 
        !qString) ? [''] : qString.match(regexes.splitBySpace);
      // clean up leftover spaces and quotes within array
      var qArrayCleaned = qArray.map(function(q) {
        return q
          .replace(regexes.prequote, '')
          .replace(regexes.postquote, '');
      });
      return qArrayCleaned;
    } 
    var formatData = function(data) {
      // returns data, lowercased and with special characters removed
      if (angular.isUndefined(data)) {
        return angular.lowercase(data);
      } else {
        return angular.lowercase(data)
          .replace(regexes.newline, ' ')
          .replace(regexes.multispace, ' ')
          .replace(regexes.symbols, '');
      }
    };
    var doesMatchAllByType = function(song, qArray, searchType) {
      // returns true if each word in qArray is a match based on searchType
      // assign formatted data
      var artistData = formatData(song.artist);
      var albumData = formatData(song.album);
      var songData = formatData(song.song);
      var lyricsData = formatData(song.lyrics);
      var allData = artistData + ' ' + albumData + ' ' + songData + ' ' + lyricsData;
      // for every string in qArray, return true if matches all
      switch (searchType) {
        case $scope.searchTypes.all:
          var doesMatchAll = qArray.every(function(q) {
            return isMatch(q, allData);
          });
          break;
        case $scope.searchTypes.artist:
          var doesMatchAll = qArray.every(function(q) {
            return isMatch(q, artistData);
          });
          break;
        case $scope.searchTypes.album:
          var doesMatchAll = qArray.every(function(q) {
            return isMatch(q, albumData);
          });
          break;
        case $scope.searchTypes.song:
          var doesMatchAll = qArray.every(function(q) {
            return isMatch(q, songData);
          });
          break;
        case $scope.searchTypes.lyrics:
          var doesMatchAll = qArray.every(function(q) {
            return isMatch(q, lyricsData);
          });
          break;
      }
      return doesMatchAll;
    };
    var isMatch = function(q, data) {
      // returns true if query is a match in input data
      if (angular.isUndefined(data)) {
        return false;
      } else {
        return data.match(q);
      }
    };

    // WORKING AREA -------------------------------------

    // query database
    Song.query(function(songs) {
      console.log('successful query'); // TEMP
      $scope.songs = songs;
    }, function(err) {
      console.log(err);
    });

    $scope.updateLocation = function() {
      // sets location query parameter to searchInput
      // gets called on ngChange for search input
      $location.search('q', $scope.searchInput);
    };

    $scope.queryByType = function(searchType) {

    };

    $scope.initLocation = function() {
      // initializes variables for new location
      var q = $location.search().q;
      if (angular.isDefined(q)) {
        $scope.searchInput = q;
        $scope.q = q;
        $scope.parseSearchType();
      }
    };

    $scope.initLocation();

    // WORKING AREA -------------------------------------

    // the filter function
    $scope.filterSearch = function(q, searchType) {
      // gets called for each song to determine if q is a match
      var qString = formatInput(q, searchType);
      var qArray = formatInputToArray(qString);
      return function(song) {
        return doesMatchAllByType(song, qArray, searchType);
      };
    };

    // set search page title
    Page.setTitle('Search — llllyrics'); // TEMP
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
      Page.setTitle(err.status + ' — llllyrics');
      console.log(err);
    });
  }]);

controllers.controller('AddCtrl', [
  '$scope',
  '$location',
  'Page',
  'Song',
  function($scope, $location, Page, Song) {
    $scope.save = function() {
      Song.save($scope.song, function(song) {
        $location.path('/' + song._id.$oid);
      }, function(err) {
        console.log(err);
      });
    }
    Page.setTitle('Add — llllyrics');
  }]);

controllers.controller('EditCtrl', [
  '$scope',
  '$location',
  '$routeParams',
  'Page',
  'Song',
  function($scope, $location, $routeParams, Page, Song) {
    var self = this;
    Song.get({id: $routeParams.songId}, function(song){
      self.original = song;
      $scope.song = new Song(self.original);
      Page.setTitle('"' + song.song + '" by ' + song.artist + ' (edit)');

    }, function(err){
      Page.setTitle(err.status + ' — llllyrics');
      console.log(err);
    });
    
    $scope.isClean = function() {
      return angular.equals(self.original, $scope.song);
    }
    $scope.destroy = function() {
      $scope.song.destroy(function() {
        $location.path('/');
      });
    }
    $scope.save = function() {
      $scope.song.update(function(song) {
        $location.path('/' + song._id.$oid);
      }, function(err) {
        console.log(err);
      });
    }
  }]);

controllers.controller('AboutCtrl', [
  '$scope',
  '$location',
  'Page',
  function($scope, $location, Page) {
    Page.setTitle('About — llllyrics');
  }]);
