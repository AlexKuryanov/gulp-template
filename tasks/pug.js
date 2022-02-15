const gulp = require( 'gulp' );
const pug = require('gulp-pug');
const plumber = require('gulp-plumber');
const data = require( 'gulp-data' );
const fs = require( 'fs' );

module.exports = function pug2html ()
{
  return gulp.src('dev/pug/pages/*.pug')
    .pipe(plumber())
    .pipe(data(function () {
      return JSON.parse(fs.readFileSync('dev/data/data.json'))
    }))
    .pipe(
      pug({
        pretty: true
      })
  )
    .pipe(plumber.stop())
    .pipe( gulp.dest( 'dist' ) )
}
