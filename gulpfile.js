const { src, dest, watch, series, parallel } = require("gulp"),
  autoprefixer = require("autoprefixer"),
  postcss = require("gulp-postcss"),
  cssnano = require("cssnano"),
  htmlmin = require("gulp-htmlmin"),
  imagemin = require("gulp-imagemin"),
  newer = require("gulp-newer"),
  sass = require("gulp-sass"),
  size = require("gulp-size"),
  assets = require("postcss-assets"),
  postcssPresetEnv = require("postcss-preset-env"),
  uglify = require("gulp-uglify"),
  babel = require("gulp-babel"),
  rename = require("gulp-rename"),
  browsersync = require("browser-sync").create();

/**************** html task ****************/
const htmlConfig = {
  src: "dev/**/*.html",
  dest: "app/"
};

function html() {
  return src(htmlConfig.src)
    .pipe(
      htmlmin({
        minifyJS: true,
        collapseWhitespace: true,
        removeComments: true
      })
    )
    .pipe(dest(htmlConfig.dest));
}

exports.html = html;

/**************** js task ****************/
const jsConfig = {
  src: "dev/js/**/*.js",
  dest: "app/js/"
};

function js() {
  return src([
    jsConfig.src
    //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
  ])
    .pipe(
      babel({
        presets: ["@babel/env"]
      })
    )
    .pipe(uglify())
    .pipe(
      rename({
        suffix: ".min"
      })
    )
    .pipe(dest(jsConfig.dest));
}

exports.js = js;

/**************** image task ****************/
const imgConfig = {
  src: "dev/images/**/*",
  dest: "app/images/"
};

function images() {
  return src(imgConfig.src)
    .pipe(newer(imgConfig.dest))
    .pipe(
      imagemin([
        //options
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }]
        })
      ])
    )
    .pipe(size({ showFiles: true }))
    .pipe(dest(imgConfig.dest));
}

exports.images = images;

/**************** css task ****************/
const scssConfig = {
  src: "dev/css/**/*.css",
  watch: "dev/css/**/*",
  dest: "app/css/",
  sassOpts: {
    imagePath: "/images/",
    precision: 3,
    errLogToConsole: true
  },

  postCSS: [
    postcssPresetEnv(/* pluginOptions */),
    assets({
      loadPaths: ["images/"],
      basePath: "app/"
    }),
    autoprefixer(),
    cssnano()
  ]
};

function css() {
  return src(scssConfig.src)
    .pipe(sass(scssConfig.sassOpts).on("error", sass.logError))
    .pipe(postcss(scssConfig.postCSS))
    .pipe(size({ showFiles: true }))
    .pipe(
      rename({
        suffix: ".min"
      })
    )
    .pipe(dest(scssConfig.dest))
    .pipe(browsersync.reload({ stream: true }));
}

exports.css = series(images, css);

/**************** server task ****************/
function serve(done) {
  browsersync.init({
    server: "app",
    browser: "firefox"
  });
  done();
}

/**************** watch task ****************/
function watchTask(done) {
  watch(imgConfig.src, images);

  watch(scssConfig.watch, css);

  watch(htmlConfig.src, html).on("change", browsersync.reload);

  watch(jsConfig.src, js).on("change", browsersync.reload);

  done();
}

/**************** default task ****************/
exports.default = series(exports.css, watchTask, serve);
