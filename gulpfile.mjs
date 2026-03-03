// ===============================
// ⚙️ Imports
// ===============================
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import browserSync from "browser-sync";
import del from "del";
import gulp from "gulp";
import cleanCSS from "gulp-clean-css";
import fileInclude from "gulp-file-include";
import newer from "gulp-newer";
import plumber from "gulp-plumber";
import rename from "gulp-rename";
import gulpReplace from "gulp-replace";
import gulpSass from "gulp-sass";
import sourcemaps from "gulp-sourcemaps";
import { rollup as rollupBuild } from "rollup";
import dartSass from "sass";
import rollupStyles from "rollup-plugin-styles";
import inject from "@rollup/plugin-inject";


// ===============================
// 🧩 Config
// ===============================
const sass = gulpSass(dartSass);
const server = browserSync.create();

const paths = {
  html: { src: "src/pages/**/*.html", dest: "dist/" },
  styles: { src: "src/scss/**/*.scss", dest: "dist/css/" },
  scripts: { src: "src/js/**/*.js", dest: "dist/js/" },
  assets: { src: "src/assets/**/*", dest: "dist/assets/" },
  static: { src: ["src/robots.txt", "src/sitemap.xml"], dest: "dist/" } /* <-- added */
};

let isProduction = false;

// ===============================
// 🧹 Clean dist
// ===============================
export function clean() {
  return del(["dist"]);
}

// ===============================
// 🧩 HTML Includes + Env Injection
// ===============================
export function html() {
  return gulp
    .src(paths.html.src)
    .pipe(
      fileInclude({
        prefix: "@@",
        basepath: "src/partials/",
        context: {
          env: isProduction ? "production" : "development",
        },
      })
    )
    .pipe(gulpReplace("@@env", isProduction ? "production" : "development"))
    .pipe(gulp.dest(paths.html.dest))
    .pipe(server.stream());
}

// ===============================
// 🎨 Styles (SCSS → CSS)
// ===============================
export function styles() {
  return gulp
    .src("src/scss/main.scss")
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        includePaths: ["src/scss"],
      }).on("error", sass.logError)
    )
    .pipe(cleanCSS({ level: 2 }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(server.stream());
}

// ===============================
// 💻 Scripts (Dev & Prod)
// ===============================

// ✅ Dev Mode — copy JS as-is
export async function scriptsDev() {
  try {
    const bundle = await rollupBuild({
      input: "src/js/main.js",
      plugins: [
        inject({
          $: "jquery",
          jQuery: "jquery",
        }),
        resolve({
          extensions: [".mjs", ".js", ".json"],
          browser: true,
          preferBuiltins: false,
        }),
        commonjs(),
        rollupStyles(),
        babel({
          babelHelpers: "bundled",
          presets: [["@babel/preset-env", { modules: false }]],
        }),
      ],
    });

    await bundle.write({
      file: "dist/js/main.js",
      format: "iife",
      name: "app",
      sourcemap: true,
    });

    await bundle.close();
    console.log("✅ JS dev build completed successfully!");
    server.reload();
  } catch (error) {
    console.error("❌ Rollup dev build failed:", error);
  }
}


// ✅ Build Mode — bundle + minify with Rollup
export async function scriptsBuild() {
  try {
    const bundle = await rollupBuild({
      input: "src/js/main.js",
      plugins: [
        inject({
          $: "jquery",
          jQuery: "jquery",
        }),
        resolve({
          extensions: [".mjs", ".js", ".json"],
          browser: true,
          preferBuiltins: false,
        }),
        commonjs(),
        rollupStyles(),
        babel({
          babelHelpers: "bundled",
          presets: [["@babel/preset-env", { modules: false }]],
        }),
      ],
    });

    await bundle.write({
      file: "dist/js/main.min.js",
      format: "iife",
      name: "app",
      sourcemap: true,
    });

    await bundle.close();
    console.log("✅ JS build completed successfully!");
  } catch (error) {
    console.error("❌ Rollup build failed:", error);
  }
}

export function legacyScripts() {
  return gulp
    .src([
      "src/js/waypoints.min.js",
      "src/js/jquery.counterup.min.js",
      "src/js/jquery.scrollUp.min.js",
      "src/js/smooth-scroll.js"
    ])
    .pipe(gulp.dest("dist/js"));
}



// ===============================
// 🖼️ Assets
// ===============================
export function assets() {
  return gulp
    .src(paths.assets.src, { encoding: false })
    .pipe(plumber())
    .pipe(newer(paths.assets.dest))
    .pipe(gulp.dest(paths.assets.dest))
    .pipe(server.stream());
}

// ===============================
// 📄 Static files (robots + sitemap)
// ===============================
export function staticFiles() { /* <-- added */
  return gulp
    .src(paths.static.src, { allowEmpty: true })
    .pipe(plumber())
    .pipe(newer(paths.static.dest))
    .pipe(gulp.dest(paths.static.dest))
    .pipe(server.stream());
}

// ===============================
// 🧠 BrowserSync Live Server (with partial watch support)
// ===============================
export function serve() {
  server.init({
    server: { baseDir: "dist/" },
    notify: false,
    open: true,
  });

  // Watch HTML + partials (footer, header, modals, etc.)
  gulp.watch(["src/**/*.html", "src/partials/**/*.html"], html);

  // Watch SCSS changes
  gulp.watch(paths.styles.src, styles);

  // Watch JS changes
  gulp.watch(paths.scripts.src, scriptsDev);

  // Watch assets (images, fonts, etc.)
  gulp.watch(paths.assets.src, assets);

  // Watch robots and sitemap
  gulp.watch(paths.static.src, staticFiles);
}


// ===============================
// 🌐 Preview Server (post-build)
// ===============================
export function preview() {
  server.init({
    server: { baseDir: "dist" },
    cors: true,
    notify: false,
    open: true,
    middleware: function (req, res, next) {
      res.setHeader(
        "Content-Security-Policy",
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
      );
      next();
    },
  });
}

// ===============================
// 🚀 Tasks (Dev & Build)
// ===============================
export const setDev = (done) => {
  isProduction = false;
  done();
};

export const setProd = (done) => {
  isProduction = true;
  done();
};

// Development (unbundled, live reload)
export const dev = gulp.series(
  clean,
  setDev,
  gulp.parallel(html, styles, scriptsDev, assets, staticFiles, legacyScripts),
  serve
);

// Production build (bundled + minified)
export const build = gulp.series(
  clean,
  setProd,
  gulp.parallel(html, styles, scriptsBuild, assets, staticFiles, legacyScripts)
);

// Preview built site
export const previewBuild = gulp.series(build, preview);

// Default task
export default dev;
