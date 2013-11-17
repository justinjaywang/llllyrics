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
    element.bind('focus', function() {
      scope.updateSearchTerm();
    });

    // element.bind('keydown', function(e) {
    //   if (e.which === 40) { // down
    //       e.preventDefault();
    //     }
    //   });
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

app.directive('infoInputHandler', function($location, $timeout, $compile) { // to do: remove inputs later as necessary
  return function(scope, element, attrs) {
    var type = attrs.infoType;
    var isArtist = (type == 'artist');
    var $ul = (isArtist) ? angular.element(document.getElementById('artistAutocomplete')) : angular.element(document.getElementById('albumAutocomplete'));
    var selectedIndex = 0;

    var showAutocomplete = function(e) {

      // var $ul = identifyUl();
      $ul = toggleAutocomplete($ul, false);

      // if (typeof scope.song === 'undefined') return;
      // if (typeof scope.song.artist === 'undefined') return;
      // // to do: add album undefined case
      if (typeof scope.song === 'undefined') { // to do: remove later if unnecessary
        console.log('scope.song undefined in showAutocomplete');
        return;
      }

      if (typeof scope.song.artist === 'undefined') return;
      if (!isArtist && (scope.song.album === '' || typeof scope.song.album === 'undefined')) return; // album, null case
      if (e.which === 27) return; // esc

      // var charArray = [16,18,32,38,40,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,96,97,98,99,100,101,102,103,104,105,186,187,188,189,190,191,191,219,220,221,222];
      // var isCharacter = charArray.some(function(element) { return (e.which === element) });
      // // if (!isCharacter) return;

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

      var matches = []; // initialize
      var limitTo = 5;
      var artistQuery = scope.song.artist;

      // populate matches
      if (isArtist) {
        scope.songs.forEach(function(element) {
          var artist = element.artist;
          var isMatch = (artist.toLowerCase().indexOf(artistQuery.toLowerCase())!=-1);
          if (isMatch) matches = updateMatches(matches, artist);
        });
      } else if (typeof artistQuery !== 'undefined') { // album, if artistQuery is not empty
        var albumQuery = scope.song.album;
        scope.songs.forEach(function(element) { // album
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

      // append matches
      $ul = toggleAutocomplete($ul, true); // show autocomplete
      matches.forEach(function(element, index) {
        var $li = angular.element('<li info-type="' + type + '" change-input>' + element.key + '</li>');
        if (index==selectedIndex) $li.addClass('selected');
        $ul.append($compile($li)(scope));
      });

      // console.log('show ul')
      // selectedIndex = 0;
    };

    var toggleAutocomplete = function($ul, show) {
      $ul.html('');
      if ($ul.hasClass('show-' + !show)) {
        $ul.removeClass('show-' + !show);
        $ul.addClass('show-' + show);
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
        // updateItemStyle(selectedIndex, ++selectedIndex);
        selectedIndex++;
        // console.log(selectedIndex);
        // console.log('down')
      } else if (k === 38) { // up
        e.preventDefault();
        // increment if possible
        if (selectedIndex == 0) return;
        // updateItemStyle(selectedIndex, --selectedIndex);
        selectedIndex--;
        // console.log(selectedIndex);
        // console.log('up')
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
        }, 150);
        if (isArtist) {
          scope.song.artist = $ul.children()[selectedIndex].innerText;
        } else {
          scope.song.album = $ul.children()[selectedIndex].innerText;
        }
      });
    };

    var updateItemStyle = function(oldIndex, newIndex) {
      // console.log('old: ', oldIndex);
      // console.log('new: ', newIndex);
      $ul.children()[oldIndex].className = '';
      $ul.children()[newIndex].className = 'selected';
    }

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

app.directive('removeLater', function() { // to do: remove
  return function(scope, element, attrs) {
    element.bind('keydown', function(e) {

      var incrementIndex = function() {
        if (scope.selectedIndex < scope.numResults) {
          scope.selectedIndex++;
        }
          // scope.selectedIndex = 0; // reset
        // } else {
          // scope.selectedIndex++;
        // }
        console.log('selected index: ', scope.selectedIndex);
      }

      var decrementIndex = function() {
        if (scope.selectedIndex != 0) {
          scope.selectedIndex--;
        }
          // scope.selectedIndex = scope.numResults; // reset
        // } else {
          // scope.selectedIndex--;
        // }
        console.log('selected index: ', scope.selectedIndex);
      }
      // set numResults
      scope.numResults = document.querySelectorAll('#search-results > #search-result').length;
      // console.log('keydown');
      if (e.which === 13) { // enter
        // scope.$apply(function() {
        //   scope.$eval(attrs.ngEnter);
        // });
        e.preventDefault();
      } else if (e.which === 40) { // down
        if (scope.numResults) {
          incrementIndex();
        }
        // scope.selectedIndex++;
        // console.log('selected index: ', scope.selectedIndex);
        console.log('numResults: ', scope.numResults);
        e.preventDefault();
      } else if (e.which === 38) { // up
        if (scope.numResults) {
          decrementIndex();
        }
        // scope.selectedIndex--;
        // console.log('selected index: ', scope.selectedIndex);
        console.log('numResults: ', scope.numResults);
        e.preventDefault();
      } else if (e.which === 27) { // esc
        e.preventDefault();
        scope.$apply(scope.clearSearchInput());
      } 
      else {// non-important key {
        console.log('other key');
      }
    });
    // element.bind('mousedown', function(e) {
    //   console.log('mousedown');
    // });
    element.bind('focus', function(e) {
      scope.selectedIndex = 0; // reset index
    });
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

function TitleCtrl($scope, $rootScope, Page) {
  $scope.Page = Page;
  $rootScope.searchTerm = '';

  $rootScope.clearSearch = function() {
    $rootScope.searchTerm = '';
  }

  // $rootScope.changeInput = function(newInput) {
  //   // console.log('testFunction!')
  //   // console.log(newInput);
  //   console.log($scope.song.artist);
  //   // $scope.song.artist = newInput;
  //   console.log(newInput);
  // };
}

function SearchCtrl($scope, $rootScope, $timeout, Page, Song) {
  $scope.songs = Song.query();
  Page.setTitle('llllyrics ');

  $scope.searchTerm = $rootScope.searchTerm;
  $scope.hasResults = ($scope.searchTerm != '') ? true : false; // true if there is previous search
  $scope.showResults = $scope.hasResults;
  $scope.showNoResults = false;

  $scope.submitSearch = function() {
    if ($scope.searchTerm.length < 2) return;

    $scope.showResults = true;
    $scope.showNoResults = true;
    var numResults = document.querySelectorAll('#search-results > #search-result').length;
    $scope.hasResults = (numResults) ? true : false;
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

    var showInput = function() {
      document.getElementById('search-input').className = 'show-true';
      document.getElementById('search-input').focus();
    }
    
    if (searchTerm == '*') { // show all results
      showInput();
      return true;
    }

    var searchTermSimple = simplifySearchTerm(searchTerm);

    if (searchTermSimple.length < 2) return false; // simplified search term is short, don't return results
    else { // longer than 1, start searching

      var searchTermArray = splitSearchTerm(searchTermSimple.toLowerCase());
      var l = searchTermArray.length;
      var artist = simplifyReference(song.artist).toLowerCase();
      var album = (song.album) ? simplifyReference(song.album).toLowerCase() : null;
      var title = simplifyReference(song.song).toLowerCase();
      var lyrics = simplifyReference(song.lyrics).toLowerCase();

      // to do: convert to forEach or every
      var matchesAll = searchTermArray.every(function(sOrig, i) { // check if match on all words

        if (i == (l-1)) showInput(); // show search input on last iteration

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
        return true;

      });

      return matchesAll;
    }
  }; // end searchFunction

  $scope.updateSearchTerm = function() { // gets called on input change
    var s = $scope.searchTerm;
    $rootScope.searchTerm = s // update global searchTerm

    $scope.showNoResults = false;
    
    document.getElementById('clear-search').className = (s.length < 2) ? 'show-false' : 'show-true';
  }

  $scope.clearSearchInput = function() {
    $rootScope.searchTerm = $scope.searchTerm = '';
    $rootScope.showResults = false;
    $rootScope.showNoResults = false;
    document.getElementById('search-input').focus();
  }

  if ($rootScope.searchTerm.length == 0) { // do normal fade in when empty
    $timeout(function() { 
      document.getElementById('search-input').className = 'show-true';
    }, 200);
  }

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

  // $scope.changeInput = function(newInput) {
  //   // console.log('testFunction!')
  //   // console.log(newInput);
  //   // console.log($scope.song.artist);
  //   $scope.song.artist = newInput;
  // };

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
