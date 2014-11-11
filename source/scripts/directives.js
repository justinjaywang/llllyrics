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
      var scrollInterval = 150,
        windowHeight = 0,
        bodyHeight = 0,
        headerHeight = 0,
        headerBufferHeight = 0,
        headerBufferMultiplier = 2,
        prevScrollTop = 0,
        scrollTop = 0,
        relativeScrollTop = 0,
        scrollBottom = 0,
        headerElement,
        headerClasses = {},
        isPristine = true;

      // construction
      var init = function() {
        if ($window.scrollIntervalId) {
          // clear previous scrollIntervalId
          $window.prevScrollIntervalId = $window.scrollIntervalId;
          clearInterval($window.prevScrollIntervalId);
        }
        $window.scrollIntervalId = setInterval(updatePage, scrollInterval);
        setInitialValues();
        bindWindowResize();
      };

      var setInitialValues = function() {
        windowHeight = $window.innerHeight;
        bodyHeight = $document[0].body.scrollHeight;
        headerHeight = element[0].offsetHeight;
        headerBufferHeight = Math.ceil(headerHeight * headerBufferMultiplier);
        prevScrollTop = $window.pageYOffset;
        scrollTop = prevScrollTop;
        scrollBottom = scrollTop + windowHeight;
        headerClasses.isAffixed = false;
        headerClasses.isShown = false;
        headerClasses.isTransitioned = false;
        isPristine = true;
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
        relativeScrollTop = scrollTop - prevScrollTop; // positive value = scrolled down
      };

      var applyClasses = function() {
        // apply classes to header element
        headerElement = angular.element(document.getElementById('stickyHeader'));
        angular.forEach(headerClasses, function(val, key) {
          if (val) {
            headerElement.addClass(key);
          } else {
            headerElement.removeClass(key);
          }
        });
      };

      var updateClasses = function() {
        // update header classes isAffixed, isShown, and isTransitioned

        var isAtTop = (scrollTop <= 0),
          isTallEnough = (bodyHeight > (windowHeight + headerBufferHeight)),
          isAtBottom = (scrollBottom >= bodyHeight) && isTallEnough,
          isBelowHeader = (scrollTop > headerHeight),
          isBelowHeaderBuffer = (scrollTop > headerBufferHeight),
          hasScrolledDown = (relativeScrollTop > 0),
          hasScrolledUp = (relativeScrollTop < 0);

        if (isAtTop && isPristine) {
          // (1a) if at top, is pristine
          // then remove affix, hide, remove transition, make not pristine, return
          // console.log('1a');
          headerClasses.isAffixed = false;
          headerClasses.isShown = false;
          headerClasses.isTransitioned = false;
          isPristine = false;
          return;
        } else if (isAtTop && !headerClasses.isAffixed && (headerClasses.isShown || headerClasses.isTransitioned)) {
          // (1b) if at top, not affixed, shown or transitioned
          // then hide and remove transition
          // console.log('1b');
          headerClasses.isShown = false;
          headerClasses.isTransitioned = false;
        } else if (isAtTop && !headerClasses.isAffixed) {
          // (1c) if at top, not affixed,
          // then return
          // console.log('1c');
          return;
        } else if (isAtTop && headerClasses.isTransitioned) {
          // (1d) if at top, (affixed), transitioned,
          // then remove transition, go to (1e)
          // console.log('1d');
          headerClasses.isTransitioned = false;
        } else if (isAtTop) {
          // (1e) if at top, (affixed), (not transitioned),
          // then remove affix, hide, make not pristine, go to (1c)
          // console.log('1e');
          headerClasses.isAffixed = false;
          headerClasses.isShown = false;
          isPristine = false;
        } else if (isPristine && !headerClasses.isAffixed) {
          // (2a) if pristine, (not affixed),
          // then affix, go to (2b)
          // console.log('2a');
          headerClasses.isAffixed = true;
        } else if (isPristine) {
          // (2b) if pristine, (affixed), (not shown), (not transitioned),
          // then show, transition, and make not pristine
          // console.log('2b');
          headerClasses.isShown = true;
          headerClasses.isTransitioned = true;
          isPristine = false;
        } else if (isAtBottom && !headerClasses.isAffixed) {
          // (3a) if at bottom, not affixed,
          // then affix, go to (3b)
          // console.log('3a');
          headerClasses.isAffixed = true;
        } else if (isAtBottom && !headerClasses.isShown) {
          // (3b) if at bottom, (affixed), not shown, (may or may not be transitioned),
          // then show, transition, go to (3c)
          // console.log('3b');
          headerClasses.isShown = true;
          headerClasses.isTransitioned = true;
        } else if (isAtBottom) {
          // (3c) if at bottom, (affixed), (shown), (transitioned),
          // then return
          // console.log('3c');
          return;
        } else if (hasScrolledDown && !(headerClasses.isAffixed && headerClasses.isShown && headerClasses.isTransitioned)) {
          // (4a) if scrolled down, not affixed, not shown, not transitioned
          // then return
          // console.log('4a');
          return;
        } else if (hasScrolledDown && (headerClasses.isAffixed && headerClasses.isShown && headerClasses.isTransitioned) && isBelowHeader) {
          // (4b) if scrolled down, affixed, shown, transitioned, is below header
          // then hide
          // console.log('4b');
          headerClasses.isShown = false;
        } else if (hasScrolledUp && !headerClasses.isAffixed && isBelowHeaderBuffer) {
          // (5a) if scrolled up, not affixed, is below header,
          // then affix, go to (5c)
          // console.log('5a');
          headerClasses.isAffixed = true;
        } else if (hasScrolledUp && (headerClasses.isShown && headerClasses.isTransitioned)) {
          // (5b) if scrolled up, (affixed), shown, transitioned,
          // then return
          // console.log('5b');
          return;
        } else if (hasScrolledUp && !headerClasses.isShown) {
          // (5c) if scrolled up, (affixed), not shown, (may or may not be transitioned),
          // then show, transition, go to (5b)
          // console.log('5c');
          headerClasses.isShown = true;
          headerClasses.isTransitioned = true;
        } else {
          // else,
          // then return
          // console.log('else');
          return;
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
      var type = attrs.autocompleteType,
        isArtist = (type == 'artist'),
        isAlbum = !isArtist,
        autocompleteListElement = (isArtist) ? angular.element(document.getElementById('autocompleteArtist')) : angular.element(document.getElementById('autocompleteAlbum')),
        matches = [],
        resultLimit = 5,
        selectedIndex = 0;

      var checkSongsIntervalId = 0,
        checkSongsInterval = 1000,
        songs = scope.globals.songs;

      // functions
      var checkSongs = function() {
        // attempt to set songs
        songs = scope.globals.songs;
        // clearInterval if songs have been successfully set
        if (songs) clearInterval(checkSongsIntervalId);
      };
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
          var autocompleteItemElement = angular.element('<li class="autocomplete-item" autocomplete-item-type="' + type + '" click-autocomplete-item>' + match + '</li>');
          if (index == selectedIndex) autocompleteItemElement.addClass('selected');
          autocompleteListElement.append($compile(autocompleteItemElement)(scope));
        });
        showMatchesInView();
      };
      var removeMatchesFromView = function() {
        autocompleteListElement.empty();
      };
      var showMatchesInView = function() {
        autocompleteListElement.removeClass('u-hide');
      };
      var hideMatchesInView = function() {
        autocompleteListElement.addClass('u-hide');
      };
      var selectAutocompleteItem = function() {
        // set text of input to be autocomplete item
        if (autocompleteListElement.children().length > 0) {
          if (isArtist) {
            scope.song.artist = autocompleteListElement.children()[selectedIndex].innerText;
          } else {
            scope.song.album = autocompleteListElement.children()[selectedIndex].innerText;
          }
        }
        // focus next input
        var nextInput = (isArtist) ? document.getElementById('inputAlbum') : document.getElementById('inputSong');
        scope.$apply(function() {
          $timeout(function() { 
            nextInput.focus();
          }, 0);
        });
      };
      var resetSelectedIndex = function() {
        selectedIndex = 0;
      };
      var keydownHandler = function(e) {
        // handles keydown events

        // prevent default on special keys: down, up, and tab or enter
        var k = e.which,
          isAutocompleteHidden = autocompleteListElement.hasClass('u-hide');

        if (isAutocompleteHidden) return;

        if (k === 40) { // down
          e.preventDefault();
          if (selectedIndex >= (autocompleteListElement.children().length - 1)) return;
          selectedIndex++;
          appendMatchesToView();
        } else if (k === 38) { // up
          e.preventDefault();
          if (selectedIndex == 0) return;
          selectedIndex--;
          appendMatchesToView();
        } else if (k === 9 && e.shiftKey) { // shift + tab
          return;
        } else if (k === 9 || k === 13) { // tab or enter
          e.preventDefault();
          selectAutocompleteItem();
        }
      };
      var keyupHandler = function(e) {
        // handles keyup events

        // if stuff is undefined, then remove from view and return
        if (angular.isUndefined(songs)) {
          console.log('songs undefined');
          return;
        }
        if (angular.isUndefined(scope.song) ||
          angular.isUndefined(scope.song.artist) ||
          (isAlbum && (angular.isUndefined(scope.song.artist) || angular.isUndefined(scope.song.album) || scope.song.album == ''))) {
          hideMatchesInView();
          return;
        }

        // return on special keyups
        if (e.which === 27) { // esc
          hideMatchesInView();
          return;
        }
        if (e.which === 9) {
          return; // tab
        }

        // update matches on valid characters
        var validChars = [8,38,40,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,96,97,98,99,100,101,102,103,104,105,186,187,188,189,190,191,219,220,221,222],
          isValidChar = validChars.some(function(char) { return (e.which === char) });

        if (!isValidChar) return;

        updateMatches();
        appendMatchesToView();
      };
      var focusHandler = function(e) {
        // reset selectedIndex
        resetSelectedIndex();
      };
      var blurHandler = function(e) {
        hideMatchesInView();
      };

      // initialization function
      var init = function() {
        // if songs haven't been set, periodically check for them
        if (!songs) checkSongsIntervalId = setInterval(checkSongs, checkSongsInterval);
        // bind events to input
        element.bind('keydown', keydownHandler);
        element.bind('keyup', keyupHandler);
        element.bind('focus', focusHandler);
        element.bind('blur', blurHandler);
      };
      
      // start
      init();
    };
  }]);

directives.directive('clickAutocompleteItem', [
  '$timeout',
  function($timeout) {
    return function(scope, element, attrs) {
      var selectAutocompleteItem = function() {
        var isArtist = (attrs.autocompleteItemType == 'artist'),
          nextInput = (isArtist) ? document.getElementById('inputAlbum') : document.getElementById('inputSong');

        scope.$apply(function() {
          // set text of input to be autocomplete item
          if (isArtist) {
            scope.song.artist = element[0].innerText;
          } else {
            scope.song.album = element[0].innerText;
          }
          // focus next input
          $timeout(function() { 
            nextInput.focus();
          }, 0);
        });
      };
      element.bind('mousedown', selectAutocompleteItem);
    };
  }]);
