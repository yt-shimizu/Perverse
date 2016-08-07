var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');

gulp.task('browserify', function() {
  browserify('./static/js/app.es6', { debug: true })
    .transform(babelify)
    .bundle()
    .on("error", function (err) { console.log("Error : " + err.message); })
    .pipe(source('app.js'))
    .pipe(gulp.dest('./static/js'))
});

gulp.task('watch', function() {
  gulp.watch('./static/js/*.es6', ['browserify'])
});

gulp.task('default', ['browserify', 'watch']);
