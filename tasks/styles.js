const gulp = require( 'gulp' );
const gulpIf = require('gulp-if');
const sass = require('gulp-sass')(require('sass'));
const plumber = require('gulp-plumber');
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require( 'gulp-autoprefixer' );
const argv = require( 'yargs' ).argv;

module.exports = function scss2css ()
{
  return gulp.src( 'dev/static/styles/styles.scss' )
    .pipe( plumber() )
    .pipe( sass() )
    .pipe( gulpIf( argv.prod, autoprefixer() ) )
    .pipe( gulpIf( argv.prod, cleanCSS( {
      level: 2
    } ) ))
    .pipe( plumber.stop() )
    .pipe( gulp.dest( 'dist/static/css/' ) )
}
