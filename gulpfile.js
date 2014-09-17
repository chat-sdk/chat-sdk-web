/**
 * Created by benjaminsmiley-andrews on 14/09/2014.
 */
// Include gulp
var gulp = require('gulp'); 

// Include Our Plugins
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var bower = require('gulp-bower');

var changed = require('gulp-changed');
var minifyHTML = require('gulp-minify-html');

// include plug-ins
var autoprefix = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');

// Setup paths
var DIST_PATH = 'app/dist/';
var DIST_TEST_PATH = 'app/dist_test/';

// CSS concat, auto prefix, minify, then rename output file
gulp.task('minify-css', function() {

  return gulp.src(['app/css/*.css', '!*.min.css', '!/**/*.min.css'])
    .pipe(concat('styles.css'))
    .pipe(autoprefix('last 2 versions'))
    .pipe(minifyCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(DIST_PATH + 'css'))
    .pipe(gulp.dest(DIST_TEST_PATH + 'css'));
});

gulp.task('copy', function () {

	gulp.src('app/img/*.*').pipe(gulp.dest( DIST_PATH + 'img'));
	gulp.src('app/img/*.*').pipe(gulp.dest( DIST_TEST_PATH + 'img'));
	
	gulp.src('app/libs/**/*.*').pipe(gulp.dest( DIST_PATH + 'libs'));
	gulp.src('app/libs/**/*.*').pipe(gulp.dest( DIST_TEST_PATH + 'libs'));
	
	gulp.src('app/bower_components/**/*.*').pipe(gulp.dest( DIST_PATH + 'bower_components'));
	gulp.src('app/bower_components/**/*.*').pipe(gulp.dest( DIST_TEST_PATH + 'bower_components'));

});

// Lint Task
gulp.task('lint', function() {
    return gulp.src('app/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// minify new or changed HTML pages
gulp.task('minify-html', function() {
var opts = {empty:true, quotes:true};

  return gulp.src('app/partials/*.html')
    //.pipe(changed(htmlPath.htmlDest))
    .pipe(minifyHTML(opts))
    .pipe(gulp.dest(DIST_PATH + 'partials'))
    .pipe(gulp.dest(DIST_TEST_PATH + 'partials'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src(['app/js/*.js'])
        .pipe(concat('all.js'))
        .pipe(gulp.dest(DIST_PATH + 'js'))
        .pipe(gulp.dest(DIST_TEST_PATH + 'js'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(DIST_PATH + 'js'))
        .pipe(gulp.dest(DIST_TEST_PATH + 'js'));
});


// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('app/js/*.js', ['lint', 'scripts', 'minify-html', 'minify-css', 'copy']);
});


// Default Task
gulp.task('default', ['lint', 'scripts', 'minify-html', 'minify-css', 'copy', 'watch']);