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
        scrollInterval = 50,
        scrollIntervalId = 0,
        substantialScroll = 25,
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
      headerClasses.isAffixed = false;
      headerClasses.isShown = false;
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
      // scope.$watch(attrs.focus, function() {
      //     $timeout(function() { 
      //       element[0].focus();
      //     }, 0);
      // }, true);
    }
  }]);