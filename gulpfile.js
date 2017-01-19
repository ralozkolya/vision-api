let gulp = require('gulp');
let sass = require('gulp-sass');
let server = require('gulp-webserver');
let compiler = require('gulp-closure-compiler');

gulp.task('build-js', () => {

	gulp.src(['src/**/*.js']).pipe(compiler({
        compilerPath: '../closure.jar',
        fileName: 'app.min.js',
        continueWithWarnings: true,
    })).pipe(gulp.dest('www/js'));
});

gulp.task('build-sass', () => {
	gulp.src('sass/**/*.scss').pipe(sass({
        outputStyle: 'compressed',
    })).pipe(gulp.dest('www/css'));
});

gulp.task('watch-js', () => {
	gulp.watch('src/**/*.js', ['build-js']);
});

gulp.task('watch-sass', () => {
    gulp.watch('sass/**/*.scss', ['build-sass']);
});

gulp.task('watch', ['watch-js', 'watch-sass'])

gulp.task('serve', ['build-sass', 'build-js'], () => {
	gulp.src('www').pipe(
		server({
		    host: '192.168.1.140',
			livereload: true,
			open: true,
		})
	);
});

gulp.task('default', ['build-js', 'build-sass', 'watch', 'serve']);