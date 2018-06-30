var gulp = require('gulp'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    browserSync = require('browser-sync').create(),
    critical = require('critical'),
    responsive = require('gulp-responsive'),
    imagemin = require('gulp-imagemin'),
    sass = require('gulp-sass');

gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: "./dist"
        }
    });
});

gulp.task('copy', function () {
    gulp.src(['manifest.json', 'index.html', 'restaurant.html'])
        .pipe(gulp.dest('dist'));
});

gulp.task('sass', function (done) {
    gulp.src('./_scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('dist/css'));

    browserSync.reload();
    done();
});

gulp.task('critical', function () {
    critical.generate({
        inline: true,
        base: '.',
        css: ['dist/css/styles.css'],
        src: 'index.html',
        dest: './dist/index.html',
        minify: true,
        width: 320,
        height: 480
    });

    critical.generate({
        inline: true,
        base: '.',
        css: ['dist/css/styles.css'],
        src: 'restaurant.html',
        dest: './dist/restaurant.html',
        minify: true,
        width: 320,
        height: 480
    });
});

gulp.task('js', function (done) {
    gulp.src(['node_modules/idb/lib/idb.js', '_js/dbhelper.js', '_js/main.js'])
        .pipe(babel())
        .pipe(uglify())
        .pipe(concat('main.min.js'))
        .pipe(gulp.dest('dist/js'));

    gulp.src(['_js/dbhelper.js', '_js/restaurant_info.js'])
        .pipe(babel())
        .pipe(uglify())
        .pipe(concat('restaurant_info.min.js'))
        .pipe(gulp.dest('dist/js'));

    gulp.src(['node_modules/idb/lib/idb.js', '_js/sw.js'])
        .pipe(babel())
        .pipe(uglify())
        .pipe(concat('sw.js'))
        .pipe(gulp.dest('dist'));

    browserSync.reload();
    done();
});

gulp.task('images', function () {
    return gulp.src('img/*.{png,jpg}')
        .pipe(responsive({
            '*.png': [{ /* DO NOTHING */ }],
            '*.jpg': [{ /* DO NOTHING */ },
                {
                    width: 280,
                    rename: function (path) {
                        path.dirname += "/scaled";
                        path.basename += "_280";
                        path.extname = ".jpg";
                        return path;
                    }
                },
                {
                    width: 280,
                    rename: function (path) {
                        path.dirname += "/scaled";
                        path.basename += "_280";
                        path.extname = ".jpg";
                        return path;
                    }
                },
                {
                    width: 335,
                    rename: function (path) {
                        path.dirname += "/scaled";
                        path.basename += "_335";
                        path.extname = ".jpg";
                        return path;
                    }
                },
                {
                    width: 385,
                    rename: function (path) {
                        path.dirname += "/scaled";
                        path.basename += "_385";
                        path.extname = ".jpg";
                        return path;
                    }
                },
                {
                    width: 432,
                    rename: function (path) {
                        path.dirname += "/scaled";
                        path.basename += "_432";
                        path.extname = ".jpg";
                        return path;
                    }
                },
                {
                    width: 640,
                    rename: function (path) {
                        path.dirname += "/scaled";
                        path.basename += "_640";
                        path.extname = ".jpg";
                        return path;
                    }
                }
            ]
        }))
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'));
});

gulp.task('default', ['copy', 'sass', 'js', 'images', 'critical', 'browser-sync', 'watch'], function () {})

gulp.task('watch', function () {
    gulp.watch('_scss/**/*.scss', ['sass']);
    gulp.watch('_js/**/*.js', ['js']);
    gulp.watch('*.html', ['copy', 'critical']);
});