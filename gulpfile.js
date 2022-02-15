const gulp = require("gulp");
const pug2html = require("./tasks/pug");
const scss2css = require("./tasks/styles");
const plumber = require("gulp-plumber");
const cleanCSS = require("gulp-clean-css");
const babel = require("gulp-babel");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");
const svgSprite = require("gulp-svg-sprite");
const svgmin = require("gulp-svgmin");
const cheerio = require("gulp-cheerio");
const spritesmith = require("gulp.spritesmith");
const buffer = require("vinyl-buffer");
const merge = require("merge-stream");
const replace = require("gulp-replace");
const stylelint = require("gulp-stylelint");
const eslint = require("gulp-eslint");
const del = require("del");
const browserSync = require("browser-sync").create();

function clean() {
  return del("dist");
}

function fonts() {
  return gulp
    .src("dev/static/fonts/**/*.*")
    .pipe(gulp.dest("dist/static/fonts/"));
}

function scssLinter() {
  return gulp
    .src("dev/static/styles/*.scss")
    .pipe(
      stylelint({
        fix: true,
        reporters: [{ formatter: "string", console: true }],
      })
    )
    .pipe(gulp.dest("dev/static/styles/"));
}

function javascript() {
  return gulp
    .src("dev/static/js/main.js")
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(uglify())
    .pipe(gulp.dest("dist/static/js/"))
    .pipe(browserSync.stream());
}

function jsLinter() {
  return gulp
    .src("dev/static/js/main.js")
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(plumber.stop());
}

function imageMinify() {
  return gulp
    .src([
      "dev/static/img/**/*.{png,svg,jpg,gif,webp}",
      "!dev/static/img/sprites/**/*.{png,svg}",
    ])
    .pipe(buffer())
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(gulp.dest("dist/static/img/"));
}

function jsVendors() {
  return gulp
    .src(["node_modules/svg4everybody/dist/svg4everybody.min.js"])
    .pipe(concat("libs.js"))
    .pipe(gulp.dest("dist/static/js/vendors/"));
}

function pngSprite() {
  const spriteData = gulp.src("dev/static/img/sprites/png/*.png").pipe(
    spritesmith({
      imgName: "sprite.png",
      imgPath: "../img/sprites/sprite.png",
      cssName: "sprite.css",
    })
  );

  // Pipe image stream through image optimizer and onto disk
  const imgStream = spriteData.img
    // DEV: We must buffer our stream into a Buffer for `imagemin`
    .pipe(buffer())
    .pipe(imagemin())
    .pipe(gulp.dest("dist/static/img/sprites/"));

  // Pipe CSS stream through CSS optimizer and onto disk
  const cssStream = spriteData.css
    .pipe(cleanCSS())
    .pipe(gulp.dest("dist/static/css/"));

  // Return a merged stream to handle both `end` events
  return merge(imgStream, cssStream);
}

function svgSpriteFunc() {
  return gulp
    .src("dev/static/img/sprites/svg/*.svg")
    .pipe(
      svgmin({
        js2svg: {
          pretty: true,
        },
      })
    )
    .pipe(
      cheerio({
        run: function ($) {
          $("[ fill ]").removeAttr("fill");
          $("[ stroke ]").removeAttr("stroke");
          $("[ style ]").removeAttr("style");
        },
        parserOptions: { xmlMode: true },
      })
    )
    .pipe(replace("&gt;", ">"))
    .pipe(
      svgSprite({
        mode: {
          symbol: {
            sprite: "sprite.svg",
          },
        },
      })
    )
    .pipe(gulp.dest("dist/static/img/sprites/"));
}

function watch() {
  browserSync.init({
    server: {
      baseDir: "dist",
    },
  });

  gulp.watch("dev/pug/**/*.*", pug2html).on("change", browserSync.reload);
  gulp.watch(
    [
      "dev/static/img/**/*.{png,svg,jpg,gif,webp}",
      "!dev/static/img/sprites/**/*.{png,svg}",
    ],
    imageMinify
  );
  gulp.watch("dev/static/img/sprites/svg/*.svg", svgSpriteFunc);
  gulp.watch("dev/static/img/sprites/png/*.png", pngSprite);
  gulp.watch("dev/static/styles/**/*.scss", scss2css);
  gulp.watch("dev/static/js/main.js", javascript);
}

const devTasks = gulp.parallel(
  fonts,
  pug2html,
  scss2css,
  javascript,
  jsVendors,
  imageMinify,
  svgSpriteFunc,
  pngSprite
);

exports.default = gulp.series(/* setMode(false),  */ clean, devTasks, watch);
exports.build = gulp.series(/* setMode(true), */ clean, devTasks, watch);

exports.test = gulp.parallel(scssLinter, jsLinter);
