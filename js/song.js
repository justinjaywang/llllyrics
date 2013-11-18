'use strict';

// declare app level module

var app = angular.module('song', ['mongolab']);

app.config(function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $routeProvider.
    when('/', {controller:SearchCtrl, templateUrl:'/search.html'}).
    when('/view/:songId', {controller:ViewCtrl, templateUrl:'/view.html'}).
    when('/edit/:songId', {controller:EditCtrl, templateUrl:'/edit.html'}).
    when('/add', {controller:AddCtrl, templateUrl:'/edit.html'}).
    when('/about', {controller:AboutCtrl, templateUrl:'/about.html'}).
    otherwise({redirectTo:'/'});
});

// directives

app.directive('autoGrow', function() {
  return function(scope, element) {
    var h = element[0].offsetHeight,
      minHeight = h*2,
      extraPadding = h;

    var $shadow = angular.element('<span></span>').css({
      position: 'fixed',
      width: element[0].offsetWidth,
      fontSize: element.css('fontSize'),
      fontFamily: element.css('fontFamily'),
      lineHeight: element.css('lineHeight'),
      visibility: 'hidden',
    });

    angular.element(document.body).append($shadow);
 
    var update = function() {
      var times = function(string, number) {
        for (var i = 0, r = ''; i < number; i++) {
          r += string;
        }
        return r;
      }
      var val = element.val().replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&/g, '&amp;')
        .replace(/\n$/, '<br/>&nbsp;')
        .replace(/\n/g, '<br/>')
        .replace(/\s{2,}/g, function(space) { return times('&nbsp;', space.length - 1) + ' ' });

      $shadow.html(val);
 
      element.css('height', Math.max($shadow[0].offsetHeight + extraPadding, minHeight) + 'px');
    }

    element.bind('focus input', update);
    update();
  }
});

app.directive('focus', function($timeout) {
  return function(scope, element, attrs) {
    scope.$watch(attrs.focus, function(val) {
      if (val) {
        $timeout(function() { 
          element[0].focus();
        }, 250);
      }
    }, true);
  }
});

app.directive('searchInputHandler', function() {
  return function(scope, element) {
    element.bind('input focus', function() {
      scope.updateSearchTerm();
    });
  }
});

app.directive('pageHandler', function($location) {
  return function(scope, element) {
    element.bind('keydown', function(e) {
      if ($location.path() != '/') return;
      var searchInput = document.getElementById('search-input');
      if (e.which === 27) { // esc
        e.preventDefault();
        if (searchInput == document.activeElement) {
          searchInput.blur();
        } else {
          searchInput.focus();
        }
      } 
    });

    element.bind('keypress', function(e) {
      var l = $location.path();
      if (l == '/add') return;
      if (l.indexOf('/view/') == 0) { // view page
        if (e.which === 101) { // e
          scope.$apply($location.path('/edit/' + l.substring('6')));
          return;
        }
      }
      if (document.getElementById('search-input') != document.activeElement) {
        if (e.which === 43) { // +
          e.preventDefault();
          scope.$apply(function() {
            scope.clearSearch();
            $location.path('/add');
          });
        }
      }
    }); // end keydown
  }
});

app.directive('infoInputHandler', function($timeout, $compile) {
  return function(scope, element, attrs) {
    var type = attrs.infoType;
    var isArtist = (type == 'artist');
    var matches = [];
    var limitTo = 3;
    var $ul = (isArtist) ? angular.element(document.getElementById('artist-autocomplete')) : angular.element(document.getElementById('album-autocomplete'));
    var selectedIndex = 0;
    var prevKeyup = null;
    var currKeyup = null;

    var showAutocomplete = function(e) {
      var updateMatches = function(matches, currKey) {
        var matched = false;
        matched = matches.some(function(element) {
          if (currKey==element.key) {
            element.count++; // increment count
            return true;
          }
          return false;
        });
        if (!matched) matches.push({'key': currKey, 'count': 1}); // add new object
        return matches;
      };

      $ul = toggleAutocomplete($ul, false);

      prevKeyup = (currKeyup) ? currKeyup : e.which;
      currKeyup = e.which;
      if (e.which === 27) return; // esc
      if (e.which === 9) return; // tab
      if (e.which === 16 && prevKeyup === 9) return; // shift + tab

      if (typeof scope.song === 'undefined') return;
      if (typeof scope.song.artist === 'undefined') return;
      if (!isArtist && (scope.song.album === '' || typeof scope.song.album === 'undefined')) return; // album, null case
      

      var charArray = [8,37,38,39,40,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,96,97,98,99,100,101,102,103,104,105,186,187,188,189,190,191,191,219,220,221,222];
      var isCharacter = charArray.some(function(element) { return (e.which === element) });

      if (isCharacter) { // character, start search

        matches = []; // initialize
        var artistQuery = scope.song.artist;

        // populate matches
        if (isArtist) {
          scope.songs.forEach(function(element) {
            var artist = element.artist;
            var isMatch = (artist.toLowerCase().indexOf(artistQuery.toLowerCase())!=-1);
            if (isMatch) matches = updateMatches(matches, artist);
          });
        } else if (typeof artistQuery !== 'undefined') { // album, if artist exists
          var albumQuery = scope.song.album;
          scope.songs.forEach(function(element) {
            if (typeof element.album === 'undefined') return; // skip songs with undefined albums

            var artist = element.artist;
            var album = element.album;
            var isArtistMatch = (artist == artistQuery);
            var isAlbumMatch = (album.toLowerCase().indexOf(albumQuery.toLowerCase())!=-1);
            var isMatch = (isArtistMatch && isAlbumMatch);

            if (isMatch) matches = updateMatches(matches, album);
          });
        }

        // sort matches
        matches.sort(function(a, b) {
          return b.count - a.count;
        });

        // truncate matches
        matches.length = limitTo;
      }
      
      // append matches
      $ul = toggleAutocomplete($ul, true); // show autocomplete
      matches.forEach(function(element, index) {
        var $li = angular.element('<li info-type="' + type + '" change-input>' + element.key + '</li>');
        if (index==selectedIndex) $li.addClass('selected');
        $ul.append($compile($li)(scope));
      });

    };

    var toggleAutocomplete = function($ul, bool) {
      $ul.html('');
      if ($ul.hasClass('show-' + !bool)) {
        $ul.removeClass('show-' + !bool);
        $ul.addClass('show-' + bool);
      }
      return $ul;
    };

    var preventDefaults = function(e) {
      var k = e.which;
      var isAutocompleteShown = $ul.hasClass('show-true');

      if (!isAutocompleteShown) return;

      if (k === 40) { // down
        e.preventDefault();
        if (selectedIndex >= ($ul.children().length-1)) return;
        selectedIndex++;
      } else if (k === 38) { // up
        e.preventDefault();
        if (selectedIndex == 0) return;
        selectedIndex--;
      } else if ((k === 9) || (k === 13)) { // tab or enter
        e.preventDefault();
        selectIndex();
      }
    };

    var selectIndex = function() {
      var nextInput = (isArtist) ? document.getElementById('album-input') : document.getElementById('song-input');

      scope.$apply(function() {
        $timeout(function() { 
          nextInput.focus();
        }, 50);
        if (isArtist) {
          scope.song.artist = $ul.children()[selectedIndex].innerText;
        } else {
          scope.song.album = $ul.children()[selectedIndex].innerText;
        }
      });
    };

    element.bind('keydown', preventDefaults);
    element.bind('keyup', showAutocomplete);
    element.bind('blur', function() {
      toggleAutocomplete($ul, false);
    });
    element.bind('focus', function() {
      selectedIndex = 0; // reset index
    });
  }
});

app.directive('changeInput', function($timeout) {
  return function(scope, element, attrs) {
    var selectItem = function() {
      var isArtist = (attrs.infoType == 'artist');
      var nextInput = (isArtist) ? document.getElementById('album-input') : document.getElementById('song-input');

      scope.$apply(function() {
        $timeout(function() { 
          nextInput.focus();
        }, 150);
        if (isArtist) {
          scope.song.artist = element[0].innerText;
        } else {
          scope.song.album = element[0].innerText;
        }
      });
    };
    element.bind('mousedown', selectItem);
  }
});

app.factory('Page', function() {
   var title = 'llllyrics';
   return {
     title: function() { return title; },
     setTitle: function(newTitle) { title = newTitle }
   };
});

// controllers

function TitleCtrl($scope, $rootScope, $timeout, Page) {
  $scope.Page = Page;
  $rootScope.searchTerm = '';

  $rootScope.clearSearch = function() {
    $rootScope.searchTerm = '';
    var searchInput = document.getElementById('search-input');
    if (searchInput) {
      $timeout(function() { 
        searchInput.focus();
      }, 150);
    }
  }
}

function SearchCtrl($scope, $location, $rootScope, $timeout, Page, Song) {
  $scope.songs = Song.query();
  Page.setTitle('llllyrics ');

  $scope.searchTerm = $rootScope.searchTerm;

  $scope.showResults = function(bool) {
    document.getElementById('search-results').className = 'show-' + bool;
  }

  $scope.showNoResults = function(bool) {
    document.getElementById('no-results').className = 'show-' + bool;
  }

  $scope.showInput = function() {
    document.getElementById('search-input').className = 'show-true';
    document.getElementById('search-input').focus();
  }

  $scope.getNumResults = function() {
    return document.querySelectorAll('#search-results > #search-result').length;
  }

  $scope.searchFunction = function(song) {
    var searchTerm = $scope.searchTerm;
    if (typeof searchTerm === 'undefined') return false;

    var simplifyReference = function(str) {
      return str.replace(/[^\w\s]/g, ''); // keep alphanumeric, spaces
    }
    var simplifySearchTerm = function(str) {
      return str.replace(/[^\w\s_:"]/g, ''); // keep alphanumeric, spaces, and : _ "
    }
    var splitSearchTerm = function(str) {
      return str.match(/[^\s"]+|"([^"]*)"/g); // keep content in double quotes together
    }

    if (searchTerm == '*') { // show all results
      $scope.showResults(true);
      $scope.showNoResults(false);
      $scope.showInput();
      return true;
    }

    var searchTermSimple = simplifySearchTerm(searchTerm);
    if (searchTermSimple.length < 1) return false;
    else { // longer than 1, start searching
      var searchTermArray = splitSearchTerm(searchTermSimple.toLowerCase());
      var l = searchTermArray.length;
      var artist = simplifyReference(song.artist).toLowerCase();
      var album = (song.album) ? simplifyReference(song.album).toLowerCase() : null;
      var title = simplifyReference(song.song).toLowerCase();
      var lyrics = simplifyReference(song.lyrics).toLowerCase();

      var matchesAll = searchTermArray.every(function(sOrig, i) { // check if match on all words
        if (sOrig.indexOf('artist:') == 0) { // artist search
          var s = simplifyReference(sOrig.substring(7).replace(/_/g, ' '));
          var isMatch = (artist.indexOf(s)!=-1);
        } else if (sOrig.indexOf('album:') == 0) { // album search
          var s = simplifyReference(sOrig.substring(6).replace(/_/g, ' '));
          var isMatch = (album) ? (album.indexOf(s)!=-1) : false;
        } else if (sOrig.indexOf('songtitle:') == 0) { // song title search
          var s = simplifyReference(sOrig.substring(10).replace(/_/g, ' '));
          var isMatch = (title.indexOf(s)!=-1);
        } else if (sOrig.indexOf('lyrics:') == 0) { // lyrics search
          var s = simplifyReference(sOrig.substring(7).replace(/_/g, ' '));
          var isMatch = (lyrics.indexOf(s)!=-1);
        } else { // default search
          var s = simplifyReference(sOrig); // remove : _ "
          var isMatch = (album) ? (artist.indexOf(s)!=-1 || album.indexOf(s)!=-1 || title.indexOf(s)!=-1 || lyrics.indexOf(s)!=-1) : (artist.indexOf(s)!=-1 || title.indexOf(s)!=-1 || lyrics.indexOf(s)!=-1);
        }
        if (!isMatch) return false; // if ever not a match, return false
        if (i == (l-1)) { // last iteration
          $scope.showResults(true);
          $scope.showNoResults(false);
          $scope.showInput();
        }
        return true;
      });
      
      return matchesAll;
    }
  }; // end searchFunction

  $scope.updateSearchTerm = function() { // gets called on input change
    var s = $scope.searchTerm;
    $rootScope.searchTerm = s // update global searchTerm

    document.getElementById('clear-search').className = (s.length < 1) ? 'show-false' : 'show-true';
    if (s.length < 1) {
      $scope.showResults(false);
      $scope.showNoResults(false);
      return;
    };

    var numResults = $scope.getNumResults();
    if (numResults == 0 && $scope.postBuffer) {
      $scope.showResults(false);
      $scope.showNoResults(true);
    }
  }

  $scope.clearSearchInput = function() {
    $rootScope.searchTerm = $scope.searchTerm = '';
    $scope.showNoResults(false);
    document.getElementById('clear-search').className = 'show-false';
    document.getElementById('search-input').focus();
  }

  $scope.feelingLucky = function() {
    var numResults = $scope.getNumResults();
    if (numResults == 0) {
      $location.path('/add');
      $scope.clearSearch();
      return;
    }

    var li = document.querySelector('#search-results > #search-result li');
    var href = li.parentNode.href; // get url of anchor
    var urlRel = href.substring(href.indexOf('/view/'));
    $timeout(function() { 
      $location.path(urlRel); // and navigate
    }, 100);
  }

  if ($rootScope.searchTerm.length == 0) { // do normal fade in when empty
    $timeout(function() { 
      document.getElementById('search-input').className = 'show-true';
    }, 200);
  }

  $scope.postBuffer = false;
  $timeout(function() { 
    $scope.postBuffer = true;
  }, 3500);

}

function ViewCtrl($scope, $location, $routeParams, Page, Song) {
  Song.get({id: $routeParams.songId}, function(song){
    $scope.song = song;
    Page.setTitle('"' + song.song + '" by ' + song.artist);    
  }, function(err){
    Page.setTitle('llllyrics / ' + err.status);
    $scope.errorId = $routeParams.songId;
  });
}

function AddCtrl($scope, $location, $timeout, Page, Song) {
  $scope.songs = Song.query();
  Page.setTitle('llllyrics / add');

  $scope.save = function() {
    Song.save($scope.song, function(song) {
      $location.path('/view/' + song._id.$oid);
    });
  }
  
  $scope.isNew = false;
  $timeout( function() {
    $scope.isNew = true;
  }, 200); // add timeout for fade in animation

  $scope.shouldFocus = true;
}

function EditCtrl($scope, $location, $routeParams, Page, Song) {
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

  $scope.isNew = false;
  $scope.shouldFocus = false;
}

function AboutCtrl($scope, Page) {
  Page.setTitle('llllyrics / about');
}
