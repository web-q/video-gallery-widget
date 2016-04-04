var gulp = require('gulp'),
    notify = require('gulp-notify'),
    watch = require('gulp-watch'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    ngAnnotate = require('gulp-ng-annotate'),
    browserSync = require('browser-sync'),
    ghPages = require('gulp-gh-pages'),
    gutil = require('gulp-util'),
    del = require('del'),
    fs = require('fs')
    ;

/*--- Set Sources ---*/
var SRC = {
  source: {
    index: 'src/index.html',
    partials: 'src/partials/*.html',
    styles: 'src/scss/app.scss',
    scripts: 'src/js/**/*.js',
    img: 'src/img/**/*'
  },
  pub: {
    root: 'app',
    index: 'app/',
    partials: 'app/partials',
    styles: 'app/css',
    scripts: 'app/js',
    img: 'app/img'
  },
  dep: {
    jslib: [
      'bower_components/angular/angular.min.js',
      'bower_components/angular-route/angular-route.min.js',
      // 'bower_components/angular-filter/dist/angular-filter.min.js',
      // 'bower_components/angular-animate/angular-animate.min.js',
      // 'bower_components/ng-onload/release/ng-onload.min.js',
      'bower_components/angular-ellipsis/src/angular-ellipsis.min.js'
      // 'bower_components/gsap/src/minified/TweenMax.min.js'
    ],
    modernizr: 'bower_components/html5-boilerplate/dist/js/vendor/modernizr-*.min.js',
    boilerplate: 'bower_components/html5-boilerplate/dist/css/*.css',
  }
};

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'Safari >= 7',
  'Opera >= 23',
  'iOS >= 7',
  'ChromeAndroid >= 4.4',
  'bb >= 10'
];

/* For printing time in messages */
var prettyLog = function(log) {
  var t = new Date().toLocaleTimeString('en-GB',{hour12:false});
  t = '\x1b[0m[\x1b[30m\x1b[1m'+t+'\x1b[0m] ';
  console.log(t + log + '\x1b[0m');
}

/*--- CSS Compiler ---*/
gulp.task('styles', function () {
  return gulp.src(SRC.source.styles)
  .pipe(sass())
  .pipe(autoprefixer({ browsers: AUTOPREFIXER_BROWSERS }))
  .pipe(gulp.dest(SRC.pub.styles))
  .pipe(cssnano())
  .pipe(rename({suffix:'.min'}))
  .pipe(gulp.dest(SRC.pub.styles))
  .pipe(gutil.env.type !== 'ci' ? notify("CSS Compiled and Minified") : gutil.noop())
  ;
});

/*--- JS Compiler ---*/
gulp.task('scripts', function () {
  return gulp.src(SRC.source.scripts)
  .pipe(concat('app.js'))
  .pipe(gulp.dest(SRC.pub.scripts))
  .pipe(ngAnnotate())
  .pipe(uglify())
  .pipe(rename({suffix:'.min'}))
  .pipe(gulp.dest(SRC.pub.scripts))
  .pipe(gutil.env.type !== 'ci' ? notify("JS Compiled and Minified") : gutil.noop())
  ;
});

/*--- HTML Compiler ---*/
gulp.task('html', function () {
  return Promise.all([
    gulp.src(SRC.source.partials)
      .pipe(gulp.dest(SRC.pub.partials)),
    gulp.src(SRC.source.index)
      .pipe(gulp.dest(SRC.pub.index))
      .pipe(notify({ message: "HTML Saved", onLast: true }))
  ]);
});

/*--- IMG Setup ---*/
gulp.task('img', function () {
  return gulp.src(SRC.source.img)
      .pipe(gulp.dest(SRC.pub.img));
});

/*--- Build Dependencies ---*/
gulp.task('build-dep', function () {
  return Promise.all([
    gulp.src(SRC.dep.jslib,{base: 'bower_components/'})
      .pipe(concat('lib.min.js'))
      .pipe(gulp.dest(SRC.pub.scripts)),
    gulp.src(SRC.dep.modernizr)
      .pipe(rename('modernizr.min.js'))
      .pipe(gulp.dest(SRC.pub.scripts)),
    gulp.src(SRC.dep.boilerplate)
      .pipe(concat('boilerplate.css'))
      .pipe(cssnano())
      .pipe(rename({suffix:'.min'}))
      .pipe(gulp.dest(SRC.pub.styles))
  ]);
});

/*--- Delete App Folder ---*/
gulp.task('clean', function(cb) {
  return del([SRC.pub.root]);
});

/*--- Build All ---*/
gulp.task('build', ['html','build-dep','img','scripts','styles']);

/*--- Watcher: CSS, JSS, HTML, etc... ---*/
gulp.task('watch', ['build'], function() {
  watch("src/**/*.scss", function() {
    gulp.start('styles');
  });
  watch(SRC.source.scripts, function() {
    gulp.start('scripts');
  });
  watch("src/**/*.html", function() {
    gulp.start('html');
  });
});

/*-------------------------------
/ Serve up Browser Sync, watch
/ for changes & inject/reload
/-------------------------------*/
gulp.task('serve',['watch'], function() {
  browserSync.init({
        server: "./app"
    });
  watch("app/css/*.css", function() {
    return gulp.src("app/css/*.css")
      .pipe(browserSync.stream());
  });
  watch("app/**/*.html").on('change', browserSync.reload);
  watch("app/js/*.js").on('change', browserSync.reload);
});

/*--- Deploy to GH-Pages ---*/
gulp.task('gh-pages',['build'], function() {
    return gulp.src('app/**/*')
      .pipe(ghPages({remoteUrl:'https://github.com/halvves/video-gallery-widget.git'}));
});

/*--- Default Gulp ---*/
gulp.task('default', ['serve']);
