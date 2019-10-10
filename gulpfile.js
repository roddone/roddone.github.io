"use strict";

// Load plugins
const autoprefixer = require("gulp-autoprefixer");
const browsersync = require("browser-sync").create();
const cleanCSS = require("gulp-clean-css");
const fs = require('fs');
const del = require("del");
const gulp = require("gulp");
const header = require("gulp-header");
const merge = require("merge-stream");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const uglify = require("gulp-uglify");
const concat = require("gulp-concat");
const handlebars = require("gulp-compile-handlebars");

// Load package.json for banner
const pkg = require('./package.json');

// Set the banner content
const banner = ['/*!\n',
	' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
	' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
	' * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n',
	' */\n',
	'\n'
].join('');

// BrowserSync
function browserSync(done) {
	browsersync.init({
		server: {
			baseDir: "./dist"
		},
		port: 8080,
		ui:false
	});
	done();
}

// BrowserSync reload
function browserSyncReload(done) {
	browsersync.reload();
	done();
}

// Clean vendor
function clean() {
	return del(["./vendor/", './dist/']);
}

//clean dist
function removeUnnecesaryFiles(){
	return del(["./dist/css/", "./dist/js/", "./dist/vendor/bootstrap/", "./dist/vendor/jquery/", "./dist/vendor/jquery-easing/"]);
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
	// Bootstrap
	var bootstrap = gulp.src('./node_modules/bootstrap/dist/**/*')
		.pipe(gulp.dest('./dist/vendor/bootstrap'));
	// Font Awesome
	var fontAwesome = gulp.src('./node_modules/@fortawesome/**/*')
		.pipe(gulp.dest('./dist/vendor'));
	// jQuery Easing
	var jqueryEasing = gulp.src('./node_modules/jquery.easing/*.js')
		.pipe(gulp.dest('./dist/vendor/jquery-easing'));
	// jQuery
	var jquery = gulp.src([
		'./node_modules/jquery/dist/*',
		'!./node_modules/jquery/dist/core.js'
	])
		.pipe(gulp.dest('./dist/vendor/jquery'));
	return merge(bootstrap, fontAwesome, jquery, jqueryEasing);
}

// CSS task
function css() {
	return gulp
		.src("./scss/**/*.scss")
		.pipe(plumber())
		.pipe(sass({
			outputStyle: "expanded",
			includePaths: "./node_modules",
		}))
		.on("error", sass.logError)
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(header(banner, {
			pkg: pkg
		}))
		.pipe(gulp.dest("./dist/css"))
		.pipe(rename({
			suffix: ".min"
		}))
		.pipe(cleanCSS())
		.pipe(gulp.dest("./dist/css"))
		.pipe(browsersync.stream());
}

// JS task
function js() {
	return gulp
		.src([
			'./js/*.js',
			'!./js/*.min.js'
		])
		.pipe(uglify())
		.pipe(header(banner, {
			pkg: pkg
		}))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest('./dist/js/'))
		.pipe(browsersync.stream());
}

function img() {
	return gulp
		.src(['./img/*'])
		.pipe(gulp.dest('./dist/img'))
		.pipe(browsersync.stream());
}

function html() {
	var english = gulp.src('index.hbs')
		.pipe(handlebars(JSON.parse(fs.readFileSync('./lang/en.json')), {}))
		.pipe(rename('english.html'))
		.pipe(gulp.dest('./dist'));

	var french = gulp.src('index.hbs')
		.pipe(handlebars(JSON.parse(fs.readFileSync('./lang/fr.json')), {}))
		.pipe(rename('index.html'))
		.pipe(gulp.dest('./dist'));

	return merge(english, french)
		.pipe(browsersync.stream());

}

function bundle() {
	var js = gulp
		.src([
			"./dist/vendor/jquery/jquery.min.js",
			'./dist/vendor/bootstrap/js/bootstrap.bundle.min.js',
			'./dist/vendor/jquery-easing/jquery.easing.min.js',
			'./dist/js/resume.min.js'
		])
		.pipe(concat('bundle.js'))
		.pipe(gulp.dest('./dist'));

	var css = gulp
		.src([
			"./dist/vendor/bootstrap/css/bootstrap.min.css",
			'./dist/css/resume.min.css'
		])
		.pipe(concat('bundle.css'))
		.pipe(gulp.dest('./dist'));
	return merge(js, css)
}

// Watch files
function watchFiles() {
	gulp.watch("./scss/**/*", css);
	gulp.watch("./js/**/*", js);
	gulp.watch("./img/**/*", img);
	gulp.watch("./**/*.html", browserSyncReload);
	gulp.watch("./lang/**/*.json", html);
	gulp.watch("./**/*.hbs", html);
}

// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(vendor, gulp.parallel(html, img, css, js), bundle);
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));
const pack = gulp.series(vendor, gulp.parallel(html, img, css, js), bundle, removeUnnecesaryFiles);

// Export tasks
exports.css = css;
exports.js = js;
exports.img = img;
exports.html = html;
exports.clean = clean;
exports.vendor = vendor;
exports.build = build;
exports.watch = watch;
exports.default = build;
exports.pack = pack;