var gulp      = require('gulp');
var watch     = require('gulp-watch');
var util      = require('gulp-util');
var htmlmin   = require('gulp-htmlmin');
var htmlify   = require('gulp-angular-htmlify');
var concat    = require('gulp-concat');
var uglify    = require('gulp-uglify');
var rename    = require('gulp-rename');
var minifycss = require('gulp-minify-css');

var paths = {};
paths.views             = 'source/**/*.html';
paths.unminifiedScripts = 'source/unminified-scripts/**/*.js';
paths.scripts           = 'source/scripts/**/*.js';
paths.styles            = 'source/styles/*.css';
paths.statics           = 'source/statics/**/*';
paths.rootStatics       = 'source/root-statics/**/*';

var dest = {};
dest.views             = 'build';
dest.unminifiedScripts = 'build/assets';
dest.scripts           = 'build/assets';
dest.styles            = 'build/assets';
dest.statics           = 'build/assets';
dest.rootStatics       = 'build';

// minify HTML views
gulp.task('views', function() {
  return gulp.src(paths.views)
    .pipe(htmlify())
    .pipe(htmlmin({collapseWhitespace: true, removeComments: true}))
    .pipe(gulp.dest(dest.views))
    .on('error', util.log);
});

// copy all non-vendor Angular JavaScript
gulp.task('unminifiedScripts', function() {
  return gulp.src(paths.unminifiedScripts)
    .pipe(concat('song.js'))
    .pipe(gulp.dest(dest.unminifiedScripts))
    .on('error', util.log);
});

// minify and copy remaining JavaScript
gulp.task('scripts', function() {
  return gulp.src(paths.scripts)
    .pipe(concat('all.js'))
    .pipe(gulp.dest(dest.scripts))
    .pipe(uglify())
    .pipe(rename({extname: '.min.js'}))
    .pipe(gulp.dest(dest.scripts))
    .on('error', util.log);
});

// concat and minify CSS
gulp.task('styles', function () {
  return gulp.src(paths.styles)
    .pipe(concat('all.css'))
    .pipe(gulp.dest(dest.styles))
    .pipe(minifycss())
    .pipe(rename({extname: '.min.css'}))
    .pipe(gulp.dest(dest.styles))
    .on('error', util.log);
});

// copy over all static assets
gulp.task('statics', function() {
 return gulp.src(paths.statics)
    .pipe(gulp.dest(dest.statics))
    .on('error', util.log);
});

// copy over all root-static assets
gulp.task('rootStatics', function() {
 return gulp.src(paths.rootStatics)
    .pipe(gulp.dest(dest.rootStatics))
    .on('error', util.log);
});

// rerun on file changes
gulp.task('watch', function() {
  gulp.watch(paths.views, ['views']);
  gulp.watch(paths.unminifiedScripts, ['unminifiedScripts']);
  // gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.statics, ['statics']);
  gulp.watch(paths.rootStatics, ['rootStatics']);
});

// default task
gulp.task('default', ['views', 'unminifiedScripts', /*'scripts', */'styles', 'statics', 'rootStatics', 'watch']);
