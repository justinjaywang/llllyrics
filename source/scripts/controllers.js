'use strict';

// Controllers

var controllers = angular.module('controllers', []);

controllers.controller('TitleCtrl', [
  '$scope',
  '$route',
  'Page',
  'Song',
  function($scope, $route, Page, Song) {
    $scope.Page = Page; // in order to set titles
    $scope.isActiveCtrl = function(controller) {
      var current = $route.current;
      if (angular.isUndefined(current)) return;
      return (current.controller == controller);
    };
    // global variables and functions
    $scope.globals = {};
    $scope.globals.querySongs = function(callback) {
      // optional parameter 1: callback function
      $scope.globals.isDoneQuerying = false;
      Song.query(function(songs) {
        $scope.globals.songs = songs;
        $scope.globals.isDoneQuerying = true;
        $scope.globals.errorStatus = ''; // set errorStatus to none
        if (typeof callback === 'function') callback();
      }, function(err) {
        $scope.globals.errorHandler(err);
        console.log(err);
      });
    };
    $scope.globals.errorHandler = function(err) {
      // handle query errors
      var errorStatus = '404';
      if (angular.isDefined(err)) {
        console.log(err);
        errorStatus = err.status;
      }
      Page.setTitle('llllyrics ' + errorStatus + ' error');
      $scope.globals.errorStatus = errorStatus;
      $scope.globals.isDoneQuerying = true;
      $scope.globals.hasJustSaved = false;
    };
  }]);

controllers.controller('SearchCtrl', [
  '$scope',
  '$window',
  '$location',
  '$timeout',
  'Page',
  'Song',
  function($scope, $window, $location, $timeout, Page, Song) {
    // define helper functions
    var changeSearchType = function(type) {
      $scope.searchType = type;
    };
    var determineSearchType = function() {
      // updates searchType based on prefixes
      if (angular.isUndefined($scope.q)) {
        console.log('$scope.q undefined in changeSearchType');
        return;
      }
      var q = $scope.q;
      if (q.match(regexes.artist)) {
        // artist search
        changeSearchType($scope.searchTypes.artist);
      } else if (q.match(regexes.album)) {
        // album search
        changeSearchType($scope.searchTypes.album);

      } else if (q.match(regexes.song)) {
        // song title search
        changeSearchType($scope.searchTypes.song);

      } else if (q.match(regexes.lyrics)) {
        // lyrics search
        changeSearchType($scope.searchTypes.lyrics);
      } else {
        // all search
        changeSearchType($scope.searchTypes.all);
      }
    };
    var setTitle = function(q) {
      if (q) {
        Page.setTitle(q + ' — llllyrics search');
      } else {
        Page.setTitle('llllyrics');
      }
    };
    var focusInputSearch = function() {
      var inputSearchElement = document.getElementById('inputSearch');
      if (inputSearchElement) { inputSearchElement.focus(); }
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
    changeSearchType('$');
    // : limit variable
    $scope.resultLimit = 48;

    // define filterSearch helper functions
    var formatInput = function(searchInput, searchType) {
      // returns input, lowercased and with special characters removed
      // if prefixed, remove prefixes also
      if (angular.isUndefined(searchInput)) return;
      // default searchType if none supplied
      if (arguments.length == 1) {
        searchType = $scope.searchTypes.all;
      }
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
      var allData = artistData + '\s' + albumData + '\s' + songData + '\s' + lyricsData;
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

    // filter function
    $scope.filterSearch = function(q, searchType) {
      // gets called for each song to determine if q is a match
      var qString = formatInput(q, searchType);
      var qArray = formatInputToArray(qString);
      return function(song) {
        return doesMatchAllByType(song, qArray, searchType);
      };
    };

    // submit function
    $scope.navigateToFirstResult = function(searchType) {
      // navigates to first search result if there are any
      // otherwise, navigate to add
      var numResults = 0,
        resultsListElement;
      switch (searchType) {
        case $scope.searchTypes.all:
          numResults = $scope.filteredSongsAll.length;
          resultsListElement = document.getElementById('searchResultsListAll');
          break;
        case $scope.searchTypes.artist:
          numResults = $scope.filteredSongsArtist.length;
          resultsListElement = document.getElementById('searchResultsListArtist');
          break;
        case $scope.searchTypes.album:
          numResults = $scope.filteredSongsAlbum.length;
          resultsListElement = document.getElementById('searchResultsListAlbum');
          break;
        case $scope.searchTypes.song:
          numResults = $scope.filteredSongsSong.length;
          resultsListElement = document.getElementById('searchResultsListSong');
          break;
        case $scope.searchTypes.lyrics:
          numResults = $scope.filteredSongsLyrics.length;
          resultsListElement = document.getElementById('searchResultsListLyrics');
          break;
      }
      if (numResults && resultsListElement) {
        var firstResultLinkElement = resultsListElement.firstElementChild.firstElementChild,
          firstResultPath = firstResultLinkElement.attributes.href.value;
        $location.search('q', null).path(firstResultPath);
      } else {
        $location.search('q', null).path('/add'); // remove query and navigate to add
      }
    };

    // location functions
    $scope.clearSearch = function() {
      $location.search('q', null);
      getQueryParams();
      focusInputSearch();
    };
    $scope.setQueryParams = function() {
      // sets location query parameter to searchInput
      // gets called on ngChange for search input
      // var searchInput = $scope.searchInput;
      // var formattedInput = formatInput(searchInput);
      var searchInput = $scope.searchInput,
        queryParams = (searchInput) ? searchInput : null;
      $location.search('q', queryParams).replace(); // TO DO: pretty format URL
      getQueryParams();
    };
    var getQueryParams = function() {
      // gets query parameters, sets page title, scope variables, and queries database
      var q = $location.search().q; // TO DO: pretty format URL
      setTitle(q);
      $scope.searchInput = q; // to populate input from query params
      $scope.q = q; // for filter functions
      $scope.formattedQ = formatInput(q); // to determine whether to show results or not
      // determine searchType if q is defined
      if (angular.isDefined(q)) determineSearchType();
    };

    // initialization function
    var init = function() {
      $scope.globals.querySongs(function() {
        $timeout(function() {
          focusInputSearch();
        }, 0);
        getQueryParams();
      });
    };

    // initialize
    init();
  }]);

controllers.controller('ViewCtrl', [
  '$scope',
  '$window',
  '$location',
  '$routeParams',
  'Page',
  function($scope, $window, $location, $routeParams, Page) {
    // more from functions
    $scope.getMoreFromArtist = function(artist) {
      $location.search('q', 'artist:"' + artist + '"').path('/');
    };
    $scope.getMoreFromAlbum = function(album) {
      $location.search('q', 'album:"' + album + '"').path('/');
    };

    // initialization function
    var init = function() {
      $scope.globals.isDoneQuerying = false;
      if ($scope.globals.hasJustSaved) {
        $window.location.reload(true);
        $scope.globals.hasJustSaved = false;
      }
      $scope.globals.querySongs(function() {
        var song = $scope.globals.songs.filter(function(song) {
          return song._id.$oid === $routeParams.songId;
        })[0];
        if (song) {
          Page.setTitle('"' + song.song + '" by ' + song.artist + ' — llllyrics');
          $scope.song = song;
        } else {
          $scope.globals.errorHandler();
        }
      });
    };

    // initialize
    init();
  }]);

controllers.controller('AddCtrl', [
  '$scope',
  '$window',
  '$location',
  'Page',
  'Song',
  function($scope, $window, $location, Page, Song) {
    $scope.save = function() {
      $scope.song.lastModified = {'$date': new Date()};
      Song.save($scope.song, function(song) {
        $window.location = '/' + song._id.$oid;
      }, function(err) {
        console.log(err);
      });
    };

    // initialization function
    var init = function() {
      Page.setTitle('add llllyrics');
      $scope.globals.querySongs(document.getElementById('inputArtist'));
    };

    // initialize
    init();
  }]);

controllers.controller('EditCtrl', [
  '$scope',
  '$window',
  '$location',
  '$routeParams',
  'Page',
  'Song',
  function($scope, $window, $location, $routeParams, Page, Song) {
    $scope.isClean = function() {
      return angular.equals(self.original, $scope.song);
    };
    $scope.destroy = function() {
      $scope.song.destroy(function() {
        $window.location = '/';
      });
    };
    $scope.save = function() {
      $scope.song.lastModified = {'$date': new Date()};
      $scope.song.update(function(song) {
        if ($window.history.length != 1) {
          $scope.globals.isDoneQuerying = false;
          $scope.globals.hasJustSaved = true;
          $window.history.back(); // navigate back to prevent edit page in history stack
        } else {
          $window.location = '/' + song._id.$oid; // go to view page
        }
      }, function(err) {
        console.log(err);
      });
    };

    // initialization function
    var init = function() {
      $scope.globals.isDoneQuerying = false;
      $scope.globals.querySongs(function() {
        var song = $scope.globals.songs.filter(function(song) {
          return song._id.$oid === $routeParams.songId;
        })[0];
        if (song) {
          self.original = song;
          $scope.song = new Song(self.original);
          Page.setTitle('"' + song.song + '" by ' + song.artist + ' — llllyrics');
        } else {
          $scope.globals.errorHandler();
        }
      });
    };

    // initialize
    var self = this;
    init();
  }]);

controllers.controller('AboutCtrl', [
  '$scope',
  'Page',
  function($scope, Page) {
    Page.setTitle('about llllyrics');
    $scope.globals.querySongs();
  }]);
