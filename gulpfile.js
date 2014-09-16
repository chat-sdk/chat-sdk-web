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

// CSS concat, auto prefix, minify, then rename output file
gulp.task('minify-css', function() {
var cssPath = {cssSrc:['app/css/*.css', '!*.min.css', '!/**/*.min.css'], cssDest:'app/dist/css/'};

  return gulp.src(cssPath.cssSrc)
    .pipe(concat('styles.css'))
    .pipe(autoprefix('last 2 versions'))
    .pipe(minifyCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(cssPath.cssDest));
});

gulp.task('copy', function () {
	gulp.src('app/img/*.*').pipe(gulp.dest('app/dist/img'));
	gulp.src('app/libs', {base: './'}).pipe(gulp.dest('app/dist/libs'));
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
var htmlPath = {htmlSrc:'app/partials/*.html', htmlDest:'app/dist/partials'};
 
  return gulp.src(htmlPath.htmlSrc)
    .pipe(changed(htmlPath.htmlDest))
    .pipe(minifyHTML(opts))
    .pipe(gulp.dest(htmlPath.htmlDest));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src(['app/js/*.js'])
        .pipe(concat('all.js'))
        .pipe(gulp.dest('app/dist/js'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('app/dist/js'));
});


// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('app/js/*.js', ['lint', 'scripts', 'minify-html', 'copy']);
});


// Default Task
gulp.task('default', ['lint', 'scripts', 'minify-html', 'copy', 'watch']);