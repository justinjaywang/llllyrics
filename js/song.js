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

// auto grow textarea and auto focus

app.directive('autoGrow', function($timeout) {
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
  return {
    link: function(scope, element, attrs) {
      scope.$watch(attrs.focus, function(val) {
        if (val) {
          $timeout(function() { 
            element[0].focus();
          }, 200);
        }
      }, true);
    }
  };
});

app.directive('updateNoResults', function($timeout) {
  return function(scope, element) {
    var update = function() {
      var searchTerm = element[0].value;
      var resultsCount = document.querySelectorAll('#search-results > #search-result').length;
      if (searchTerm.length < 3) {
        var noResults = false;
      } else if (resultsCount > 0) { // some results
        var noResults = false;
      } else { // no results
        var noResults = true;
      }
      document.getElementById('no-results').className = 'show-' + noResults;
    }
    element.bind('input', update);
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

function TitleCtrl($scope, Page) {
  $scope.Page = Page;
}

function SearchCtrl($scope, Page, Song) {
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
    
    if (searchTerm == '*') return true;
    
    var searchTermSimple = simplifySearchTerm(searchTerm);

    if (searchTermSimple.length <= 1) return false;
    else { // longer than 1, start searching
      var searchTermArray = splitSearchTerm(searchTermSimple.toLowerCase());
      // console.log(searchTermArray);
      var l = searchTermArray.length;
      var artist = simplifyReference(song.artist).toLowerCase();
      var album = (song.album) ? simplifyReference(song.album).toLowerCase() : null;
      var title = simplifyReference(song.song).toLowerCase();
      var lyrics = simplifyReference(song.lyrics).toLowerCase();

      for (var i=0; i<l; i++) {
        
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
        if (i == (l-1)) { // last iteration, has not encountered return false
          return true;
        } else {
          continue;
        }
        
      }
    }
  };
}

function ViewCtrl($scope, $location, $routeParams, Page, Song) {
  Song.get({id: $routeParams.songId}, function(song){
    $scope.song = song;
    Page.setTitle('llllyrics / "' + song.song + '" by ' + song.artist);    
  }, function(err){
    Page.setTitle('llllyrics / ' + err.status);
    $scope.errorId = $routeParams.songId;
  });
}

function AddCtrl($scope, $location, $timeout, Page, Song) {
  $scope.save = function() {
    Song.save($scope.song, function(song) {
      $location.path('/view/' + song._id.$oid);
    });
  }
  
  $scope.isNew = false;
  $timeout( function() {
    $scope.isNew = true;
  }, 150); // add timeout for fade in animation

  $scope.shouldFocus = true;

  Page.setTitle('llllyrics / add');
}

function EditCtrl($scope, $location, $routeParams, Page, Song) {
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
