
var gulp = require('gulp');
var rename = require('gulp-rename');
var coffee = require('gulp-coffee');
var gutil = require('gulp-util');
var prettify = require('gulp-jsbeautifier');

gulp.task('coffee', function() {
    gulp.src('./coffee/*.coffee')
        .pipe(coffee({
            bare: true
        }).on('error', gutil.log))
        .pipe(prettify({indentSize: 4}))
        .pipe(gulp.dest('./'));
});

// Задача на отслеживание изменений
gulp.task('watch', function() {
    gulp.watch('./coffee/*', ['coffee']);
});
