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
