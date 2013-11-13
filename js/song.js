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
    // $timeout(function(){
    //   update();
    // }, 250);
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

app.directive('feelingLucky', function($location, $timeout) {
  return function(scope, element) {
    element.bind('keydown', function(e) {
      if (e.which === 13) { // enter
        e.preventDefault();
        var numResults = document.querySelectorAll('#search-results > #search-result').length;
        if (numResults) {
          // set styles on first element
          var firstItem = document.querySelector('#search-results > #search-result li');
          var firstIcon = firstItem.querySelector('.icon-right');
          firstItem.style.color = '#0f9';
          firstIcon.style.opacity = 1;
          firstIcon.style.visibility = 'visible';
          
          // navigate to relative url
          var url = firstItem.parentNode.href;
          var urlRel = url.substring(url.indexOf('/view/'));
          $timeout(function() { 
            scope.$apply($location.path(urlRel));
          }, 100);
        }
      } else if (e.which === 27) { // esc
        e.preventDefault();
        scope.$apply(scope.clearSearchInput());
      }
    });
  }
});

app.directive('removeLater', function() {
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
}

function SearchCtrl($scope, $rootScope, $timeout, Page, Song) {
  $scope.songs = Song.query();
  Page.setTitle('llllyrics ');

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
    
    if (searchTerm == '*') { // wildcard, show all results
      document.getElementById('search-input').className = 'show-true';
      document.getElementById('search-input').focus();
      document.getElementById('search-results').className = 'show-true';
      return true;
    }

    document.getElementById('clear-search').className = (searchTerm.length < 2) ? 'show-false' : 'show-true'; // hide clear-search icon
    
    var searchTermSimple = simplifySearchTerm(searchTerm);

    if (searchTermSimple.length <= 1) return false; // simplified search term is short, don't return results
    else { // longer than 1, start searching
      var searchTermArray = splitSearchTerm(searchTermSimple.toLowerCase());
      var l = searchTermArray.length;
      var artist = simplifyReference(song.artist).toLowerCase();
      var album = (song.album) ? simplifyReference(song.album).toLowerCase() : null;
      var title = simplifyReference(song.song).toLowerCase();
      var lyrics = simplifyReference(song.lyrics).toLowerCase();

      for (var i=0; i<l; i++) { // for each word, check if match
        
        var sOrig = searchTermArray[i];

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

        if (i == (l-1)) { // last iteration, has not encountered return false so it is a match
          document.getElementById('no-results').className = 'show-false'; // remove no-results if still shown
          document.getElementById('search-input').className = 'show-true'; // show search-input if not already shown
          document.getElementById('search-input').focus();
          document.getElementById('search-results').className = 'show-true';
          return true;
        } else {
          continue;
        }
        
      }
    }
  };

  $scope.searchTerm = $rootScope.searchTerm;

  $scope.updateState = function() {
    $rootScope.searchTerm = $scope.searchTerm; // update global searchTerm

    var l = $rootScope.searchTerm.length;
    if (l > 2) { // minumum requirement to show
      document.getElementById('no-results').className = 'show-true';
    } else {
      document.getElementById('no-results').className = 'show-false';
    }
  }

  $scope.clearSearchInput = function() {
    $rootScope.searchTerm = $scope.searchTerm = '';
    document.getElementById('no-results').className = 'show-false';
    document.getElementById('clear-search').className = 'show-false';
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

  $scope.updateEdit = function() {
    
  }
}

function AboutCtrl($scope, Page) {
  Page.setTitle('llllyrics / about');
}
