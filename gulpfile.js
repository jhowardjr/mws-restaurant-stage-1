var gulp = require('gulp'),
    gutil = require('gulp-util'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat');

gulp.task('js', function () {

    gulp.src(['_js/dbhelper.js', '_js/main.js'])
        .pipe(babel())
        .pipe(uglify())
        .pipe(concat('main.min.js'))
        .pipe(gulp.dest('js'));

    gulp.src(['_js/dbhelper.js', '_js/restaurant_info.js'])
        .pipe(babel())
        .pipe(uglify())
        .pipe(concat('restaurant_info.min.js'))
        .pipe(gulp.dest('js'));

    gulp.src(['node_modules/idb/lib/idb.js', '_js/sw.js'])
        .pipe(babel())
        .pipe(uglify())
        .pipe(concat('sw.js'))
        .pipe(gulp.dest('.'));

});

// TODO: MOVE IMAGE CREATION TO GULP