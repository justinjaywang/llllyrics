'use strict';

// declare app level module

var app = angular.module('song', ['mongolab'])
  .config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:SearchCtrl, templateUrl:'search.html'}).
      when('/view/:songId', {controller:ViewCtrl, templateUrl:'view.html'}).
      when('/edit/:songId', {controller:EditCtrl, templateUrl:'edit.html'}).
      when('/add', {controller:AddCtrl, templateUrl:'edit.html'}).
      when('/about', {controller:AboutCtrl, templateUrl:'about.html'}).
      otherwise({redirectTo:'/'});
  });

// auto grow textarea

app.directive('autoGrow', function() {
  return function(scope, element){
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

    element.bind('mouseenter focus keyup keydown keypress change', update);

    update();
  }
});

app.factory('Page', function() {
   var title = 'llllyrics / a minimal lyrics viewer';
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
  }, 200);
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
}

function AboutCtrl($scope, Page) {
  Page.setTitle('llllyrics / about');
}
