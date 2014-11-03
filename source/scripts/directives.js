'use strict';

// Directives

var directives = angular.module('directives', []);

// lowerCamelCase

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
        scrollInterval = 10,
        scrollIntervalId = 0,
        substantialScroll = 8,
        windowHeight = 0,
        bodyHeight = 0,
        headerHeight = 0,
        prevScrollTop = 0,
        scrollTop = 0,
        relativeScrollTop = 0,
        scrollBottom = 0,
        counter = 0,
        transitionIntervals = transitionDuration / scrollInterval;

      scope.isAffixed = false;
      scope.isShown = false;
      scope.isTransitioned = false;

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

      var updateClasses = function() {
        // two sets of actions, depending on isTransitioned
        if (!scope.isTransitioned) {
          // not transitioned
          if (!scope.isAffixed && (scrollTop > headerHeight)) {
            // if not affixed and scrolled below header,
            // then affix and set transition after apply
            scope.isAffixed = true;
            scope.isShown = false;
            scope.$apply();
            scope.isTransitioned = true;
          } else if (scope.isAffixed && (scrollTop <= 0)) {
            // if affixed and scrolled to top,
            // then remove affix after timeout
            scope.isAffixed = false;
          }
        } else {
          // transitioned
          if ((scrollTop <= 0) && scope.isShown) {
            // if scrolled to top and is shown,
            // then remove transition after allowing show transition to occur
            counter++;
            if (counter >= transitionIntervals) {
              scope.isTransitioned = false;
              counter = 0;
            }
          } else if ((scrollTop <= 0) && !scope.isShown) {
            // if scrolled to top and is not shown,
            // then finish showing
            scope.isShown = true;
          } else if ((scrollTop <= headerHeight) && !scope.isShown) {
            // if scrolled within header and is not shown,
            // then remove affix and remove transition
            scope.isAffixed = false;
            scope.isTransitioned = false;
          } else if (scrollBottom >= bodyHeight) {
            // if scrolled to bottom,
            // then show
            scope.isShown = true;
          } else if (scope.isShown && (relativeScrollTop > 0)) {
            // if shown and scrolled down,
            // then remove show
            scope.isShown = false;
          } else if (!scope.isShown && (relativeScrollTop < -substantialScroll)) {
            // if not shown and scrolled up substantially,
            // then show
            scope.isShown = true;
          }
        }
        scope.$apply();
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
