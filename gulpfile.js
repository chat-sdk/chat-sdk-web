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

var bowerSrc = require('gulp-bower-src');

var insert = require('gulp-insert');

// Setup paths
var DIST_PATH = 'app/dist/';
var DIST_TEST_PATH = 'app/dist_test/';

// CSS concat, auto prefix, minify, then rename output file
gulp.task('minify-css', function() {

    var src = [
        //'app/css/*.css',
//         'node_modules/html5-boilerplate/css/normalize.css',
//         'node_modules/html5-boilerplate/css/main.css',
        'app/libs/flags/stylesheets/flags/common.css',
        'app/libs/flags/stylesheets/flags/flags32.css',
        'app/libs/flags/stylesheets/flags/flags16.css',
        'app/css/reset-uikit.css',
        'app/css/style.css',
        'node_modules/angular-emoji-filter-hd/dist/emoji.min.css',
        'node_modules/pikaday/css/pikaday.css'

        //'node_modules/uikit/dist/css/uikit.css',
        //'node_modules/uikit/dist/css/uikit.gradient.css',
        //'!*.min.css',
        //'!/**/*.min.css'
    ]

    return gulp.src(src)
        .pipe(concat('cc_styles.css'))
        .pipe(autoprefix('last 2 versions'))
        .pipe(gulp.dest(DIST_PATH + 'css/_'))
        .pipe(gulp.dest(DIST_TEST_PATH + 'css/_'))
        .pipe(minifyCSS())
        .pipe(rename({ suffix: '.min' }))
        // Copy to _ otherwise flags won't work
        .pipe(gulp.dest(DIST_PATH + 'css/_'))
        .pipe(gulp.dest(DIST_TEST_PATH + 'css/_'));
});

gulp.task('copy', function () {

    gulp.src('app/img/*.*').pipe(gulp.dest( DIST_PATH + 'img'));
    gulp.src('app/img/*.*').pipe(gulp.dest( DIST_TEST_PATH + 'img'));

    gulp.src('app/fonts/*.*').pipe(gulp.dest( DIST_PATH + 'css/fonts'));
    gulp.src('app/fonts/*.*').pipe(gulp.dest( DIST_TEST_PATH + 'css/fonts'));


    gulp.src('app/libs/**/*.*').pipe(gulp.dest( DIST_PATH + 'libs'));
    gulp.src('app/libs/**/*.*').pipe(gulp.dest( DIST_TEST_PATH + 'libs'));

    gulp.src('app/chatcat_include.txt').pipe(gulp.dest( DIST_PATH )).pipe(gulp.dest( DIST_TEST_PATH ));

    // Copy the flag images
    gulp.src('app/libs/flags/images/flags/*.png').pipe(gulp.dest( DIST_PATH + 'images/flags/'));
    gulp.src('app/libs/flags/images/flags/*.png').pipe(gulp.dest( DIST_TEST_PATH + 'images/flags/'));

    gulp.src('node_modules/angular-emoji-filter-hd/dist/*.png').pipe(gulp.dest( DIST_PATH + 'css/_/'));
    gulp.src('node_modules/angular-emoji-filter-hd/dist/*.png').pipe(gulp.dest( DIST_TEST_PATH + 'css/_/'));

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

    var paths = [
//        'node_modules/html5-boilerplate/js/vendor/modernizr-2.6.2.min.js',
        'node_modules/jquery/dist/jquery.min.js',
//        'node_modules/uikit/dist/js/uikit.min.js',
        'node_modules/angular/angular.js',
//        'node_modules/angular/angular.min.js',
//         'node_modules/angular-cookies/angular-cookies.min.js',
        'node_modules/jquery-cookie/jquery.cookie.js',
//         'node_modules/angular-file-upload/dist/angular-file-upload.min.js',
//         'node_modules/angular-file-upload/dist/angular-file-upload-shim.min.js',
        'node_modules/ng-file-upload/dist/ng-file-upload.min.js',
        'node_modules/ng-file-upload/dist/ng-file-upload-shim.min.js',

        'node_modules/firebase/firebase.js',
        'node_modules/angularfire/dist/angularfire.min.js',
        'node_modules/firebase-simple-login/firebase-simple-login.js',
        // 'node_modules/angular-facebook/lib/angular-facebook.js',
        'node_modules/FileSaver/FileSaver.js',
        'node_modules/moment/min/moment.min.js',
        'node_modules/angular-sanitize/angular-sanitize.min.js',
        //'node_modules/angular-emoji-filter-hd/lib/cc-emoji.js',
        'node_modules/pikaday/pikaday.js',
        'node_modules/howler/dist/howler.min.js',
        'app/libs/sha256.js',
        'app/libs/cc-emoji.js',
        'app/js/*.js'
    ];

    // Non-minified version
    gulp.src(paths)
        .pipe(concat('all.js'))
        .pipe(insert.wrap('var cc = (function () {', '}());jQuery.noConflict(true);'))
        .pipe(gulp.dest(DIST_PATH + 'js'))
        .pipe(gulp.dest(DIST_TEST_PATH + 'js'));

    gulp.src(paths)
        .pipe(concat('all.js'))
        .pipe(rename('all.min.js'))
        //	    .pipe(uglify('all.min.js', {
        //    	  outSourceMap: true
        //    	}))
        .pipe(insert.wrap('var cc = (function () {', '}()); jQuery.noConflict(true);'))
        .pipe(gulp.dest(DIST_PATH + 'js'))
        .pipe(gulp.dest(DIST_TEST_PATH + 'js'));

    gulp.src(['node_modules/dist.js'])
        .pipe(rename('dist.min.js'))
        .pipe(gulp.dest(DIST_PATH + 'js'))
        .pipe(gulp.dest(DIST_TEST_PATH + 'js'));

//     paths = [
//     ];
//
//     gulp.src(paths)
//         .pipe(concat('dist.min.js'))
//         .pipe(gulp.dest(DIST_PATH + 'js'))
//         .pipe(gulp.dest(DIST_TEST_PATH + 'js'));

});

// gulp.task('bower', function () {
//     bower(gulp.src('app'))
//         .pipe(gulp.dest('app/dist_test/vendor'));
// });

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch(['app/js/*.js','app/css/*.css', 'app/partials/*.html'], ['lint', 'scripts', 'minify-html', 'minify-css', 'copy']);
});


// Default Task
gulp.task('default', ['lint', 'scripts', 'minify-html', 'minify-css', 'copy', 'watch']);