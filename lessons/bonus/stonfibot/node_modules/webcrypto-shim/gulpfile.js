"use strict";

var pkg     = require('./package.json'),
    gulp    = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify  = require('gulp-uglify'),
    concat  = require('gulp-concat');

gulp.task( 'build', function () {
    return gulp
        .src( 'webcrypto-shim.js' )
        .pipe( sourcemaps.init() )
        .pipe( uglify( { output: { preamble: "/*! WebCrypto API shim" + ( pkg.version ? " v"+pkg.version : "" ) + ", (c) 2015 "  + pkg.author + ", opensource.org/licenses/" + pkg.license + " */" } } ) )
        .pipe( concat( 'webcrypto-shim.min.js') )
        .pipe( sourcemaps.write('./') )
        .pipe( gulp.dest('./') );
});

gulp.task( 'default', gulp.series('build') );
