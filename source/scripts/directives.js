'use strict';

// Directives

var directives = angular.module('directives', []);

directives.directive('autoGrow', [
  function() {
    return function(scope, element, attrs) {
      var h = element[0].offsetHeight,
        minHeight = h*2,
        extraPadding = h;

      var $shadow = angular.element('<span></span>').css({
        position: 'fixed',
        width: element[0].offsetWidth + 'px',
        visibility: 'hidden'
      });

      angular.element(document.getElementById('articleLyricsEdit')).append($shadow);
   
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

      element.bind('input', update);

      scope.$watch(attrs.ngModel, function(val) {
        update();
      }, true);
    }
  }]);

directives.directive('stickyHeader', [
  '$window',
  '$document',
  function ($window, $document) {
    return function(scope, element, attrs) {
      // variables
      var transitionDuration = 250,
        scrollInterval = 100,
        scrollIntervalId = 0,
        substantialScroll = 0,
        windowHeight = 0,
        bodyHeight = 0,
        headerHeight = 0,
        prevScrollTop = 0,
        scrollTop = 0,
        relativeScrollTop = 0,
        scrollBottom = 0,
        addTransition = false,
        removeTransitionCounter = 0,
        transitionIntervals = Math.ceil(transitionDuration / scrollInterval);

      var headerClasses = {};
      headerClasses.isAffixed = true;
      headerClasses.isShown = true;
      headerClasses.isTransitioned = false;

      // construction
      var init = function() {
        scrollIntervalId = setInterval(updatePage, scrollInterval);
        setInitialValues();
        bindWindowResize();
      };

      var setInitialValues = function() {
        windowHeight = $window.innerHeight,
        bodyHeight = $document[0].body.scrollHeight,
        headerHeight = element[0].offsetHeight;
        prevScrollTop = $window.pageYOffset;
        scrollTop = prevScrollTop;
        scrollBottom = scrollTop + windowHeight;
      };

      // updating
      var updatePage = function() {
        $window.requestAnimationFrame(function() {
          updateValues();
          updateClasses();
        });
      };

      var updateValues = function() {
        bodyHeight = $document[0].body.scrollHeight;
        prevScrollTop = scrollTop;
        scrollTop = $window.pageYOffset;
        scrollBottom = scrollTop + windowHeight;
        relativeScrollTop = scrollTop - prevScrollTop;
      };

      var applyClasses = function() {
        var headerElement = angular.element(document.getElementById('stickyHeader'));
        angular.forEach(headerClasses, function(val, key) {
          if (val) {
            headerElement.addClass(key);
          } else {
            headerElement.removeClass(key);
          }
        });
      };

      var updateClasses = function() {
        // two sets of actions, depending on isTransitioned
        if (!headerClasses.isTransitioned) {
          // not transitioned
          if (addTransition) {
            // if should addTransition,
            // then add transition and reset toggle
            headerClasses.isTransitioned = true;
            addTransition = false;
          } else if (!headerClasses.isAffixed && (scrollTop > headerHeight)) {
            // if not affixed and scrolled below header,
            // then affix and set addTransition to true for next call to updateClasses
            headerClasses.isAffixed = true;
            headerClasses.isShown = false;
            addTransition = true;
          } else if (headerClasses.isAffixed && (scrollTop <= 0)) {
            // if affixed and scrolled to top,
            // then remove affix after timeout
            headerClasses.isAffixed = false;
          }
        } else {
          // transitioned
          if ((scrollTop <= 0) && headerClasses.isShown) {
            // if scrolled to top and is shown,
            // then remove transition after allowing show transition to occur
            removeTransitionCounter++;
            if (removeTransitionCounter >= transitionIntervals) {
              headerClasses.isTransitioned = false;
              removeTransitionCounter = 0;
            }
          } else if ((scrollTop <= 0) && !headerClasses.isShown) {
            // if scrolled to top and is not shown,
            // then finish showing
            headerClasses.isShown = true;
          } else if ((scrollTop <= headerHeight) && !headerClasses.isShown) {
            // if scrolled within header and is not shown,
            // then remove affix and remove transition
            headerClasses.isAffixed = false;
            headerClasses.isTransitioned = false;
          } else if (scrollBottom >= bodyHeight) {
            // if scrolled to bottom,
            // then show
            headerClasses.isShown = true;
          } else if (headerClasses.isShown && (relativeScrollTop > 0)) {
            // if shown and scrolled down,
            // then remove show
            headerClasses.isShown = false;
          } else if (!headerClasses.isShown && (relativeScrollTop < -substantialScroll)) {
            // if not shown and scrolled up substantially,
            // then show
            headerClasses.isShown = true;
          }
        }
        applyClasses();
      };

      // bind window resize
      var bindWindowResize = function() {
        angular.element($window).bind('resize', function() {
          setInitialValues();
        });
      };

      // start
      init();
    };
  }]);

directives.directive('focus', [
  '$timeout',
  function($timeout) {
    return function(scope, element, attrs) {
      $timeout(function() { 
        element[0].focus();
      }, 0);
    };
  }]);

directives.directive('navigateBack', [
  '$window',
  function($window) {
    return function(scope, element, attrs) {
      element.on('click', function() {
        if ($window.history.length != 1) {
          $window.history.back();
        } else {
          $window.location = '/'; // if no back history, go home
        }
      });
    };
  }]);

directives.directive('autocomplete', [
  '$timeout',
  '$compile',
  function($timeout, $compile) {
    return function(scope, element, attrs) {
      // variables
      var isArtist = (attrs.autocompleteField == 'artist'),
        isAlbum = !isArtist,
        autocompleteListElement = (isArtist) ? angular.element(document.getElementById('autocompleteArtist')) : angular.element(document.getElementById('autocompleteAlbum')),
        songs = scope.globals.songs,
        matches = [],
        resultLimit = 5,
        selectedIndex = 0,
        prevKeyup = null,
        currKeycup = null;

      // functions
      var resetMatches = function() {
        matches = [];
      };
      var pushMatch = function(matches, match) {
        var i = matches.indexOf(match);
        if (i == -1) {
          matches.push(match);
        }
      }
      var isMatch = function(q, data) {
        // returns true if query is a match in input data
        if (angular.isUndefined(data)) {
          return false;
        } else {
          return data.match(q);
        }
      };
      var updateMatches = function() {
        // updates matches array for input query
        resetMatches();
        var artistQuery = angular.lowercase(scope.song.artist);
        if (isArtist) {
          songs.forEach(function(song) {
            if (matches.length >= resultLimit) return; // skip if already enough matches
            var artistData = angular.lowercase(song.artist);
            if (isMatch(artistQuery, artistData)) {
              pushMatch(matches, song.artist);
            }
          });
        } else { // isAlbum
          songs.forEach(function(song) {
            if (matches.length >= resultLimit) return; // skip if already enough matches
            if (angular.isUndefined(song.album)) return; // skip if album not defined
            var artistData = angular.lowercase(song.artist),
              isArtistMatch = (artistQuery == artistData);
            if (!isArtistMatch) return; // skip if not an artist match
            var albumQuery = angular.lowercase(scope.song.album),
              albumData = angular.lowercase(song.album),
              isAlbumMatch = isMatch(albumQuery, albumData);
            if (isAlbumMatch) {
              pushMatch(matches, song.album);
            }
          });
        }
      };
      var appendMatchesToView = function() {
        // remove previous matches
        removeMatchesFromView();
        // appends new matches
        matches.forEach(function(match, index) {
          var autocompleteItemElement = angular.element('<li class="autocomplete-item">' + match + '</li>');
          // var autocompleteItemElement = angular.element('<li info-type="' + type + '" change-input>' + element.key + '</li>'); // TO DO: change input directive
          if (index == selectedIndex) autocompleteItemElement.addClass('selected');
          autocompleteListElement.append($compile(autocompleteItemElement)(scope));
        });
        showMatchesInView();
      };
      var removeMatchesFromView = function() {
        autocompleteListElement.empty();
      };
      var showMatchesInView = function() {
        autocompleteListElement.removeClass('u-hide'); // TO DO: WIP decide if add or remove class
      };
      var hideMatchesInView = function() {
        autocompleteListElement.addClass('u-hide'); // TO DO: WIP decide if add or remove class
      };
      var keyupHandler = function(e) {
        // handles keyup events

        // if stuff is undefined, then remove from view and return
        if (angular.isUndefined(scope.song) ||
          angular.isUndefined(scope.song.artist) ||
          (isAlbum && (angular.isUndefined(scope.song.album) || angular.isUndefined(scope.song.album)))) {
          hideMatchesInView();
          return;
        }

        // if it's a special character, do stuff
        // TO DO

        // else, then update matches
        updateMatches();
        appendMatchesToView();
      };

      // initialization function
      var init = function() {
        element.bind('keyup', keyupHandler);
      };
      
      // start
      init();
    };
  }]);
