'use strict';

// Filters

var filters = angular.module('filters', []);

// filters.filter('numResultsFilter', function() {
//   return function(n) {
//     if (n == 0) {
//       return 'No results';
//     } else if (n == 1) {
//       return '1 result';
//     } else {
//       return n + ' results';
//     }
//   }; 
// });

// filters.filter('trimExcessWhitespace', function() {
//   return function(val) {
//     console.log(typeof val);
//     return val;
//     // return (!val) ? '' : val.replace(/\s{2,}/g, ' ');
//   };
// });

// filters.filter('searchAll', function() {
//   return function(songs, q) {
//     console.log(songs);
//     console.log(q);
//     return songs.filter(function(song) {
//       return song.match(q);
//     });
//   };
// });
