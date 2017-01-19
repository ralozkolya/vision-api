var gulp = require("gulp");
var sass = require("gulp-sass");
var server = require("gulp-webserver");
var compiler = require("gulp-closure-compiler");

gulp.task("build-js", function () {
	gulp.src(["src/**/*.js"]).pipe(compiler({
        compilerPath: "../closure.jar",
        fileName: "app.min.js",
        continueWithWarnings: true
    })).pipe(gulp.dest("www/js"));
});

gulp.task("build-sass", function () {
	gulp.src("sass/**/*.scss").pipe(sass({
        outputStyle: "compressed"
    })).pipe(gulp.dest("www/css"));
});

gulp.task("watch-js", function () {
	gulp.watch("src/**/*.js", ["build-js"]);
});

gulp.task("watch-sass",  function () {
    gulp.watch("sass/**/*.scss", ["build-sass"]);
});

gulp.task("watch", ["watch-js", "watch-sass"]);

gulp.task("serve", ["build-sass", "build-js"], function () {
	gulp.src("www").pipe(
		server({
		    host: "192.168.1.140",
			livereload: true,
			open: true
		})
	);
});

gulp.task("default", ["build-js", "build-sass", "watch", "serve"]);