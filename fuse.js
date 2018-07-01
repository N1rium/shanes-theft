const proxyServer = require("./proxy-server");

const {
  FuseBox,
  WebIndexPlugin,
  RawPlugin,
  ReplacePlugin,
  QuantumPlugin,
  Sparky,
  JSONPlugin
} = require("fuse-box");

const BUILD_PATH = "build/";
Sparky.task("default", ["clean", "copy-assets"], devServer);
Sparky.task("prod", ["clean", "copy-assets", "production"], () => {});
Sparky.task("clean", () => Sparky.src(BUILD_PATH).clean(BUILD_PATH));
Sparky.task("copy-assets", () =>
  Sparky.src("assets/**/**.*", { base: "./src" }).dest("./build")
);
Sparky.task("production", prod);

function devServer() {
  const fuse = init(false);
  fuse.dev({ port: 8888, root: false }, server =>
    proxyServer(server.httpServer.app)
  );
  fuse.bundle("app").instructions(" > index.js");
  fuse.run();
}

function init(prod) {
  return FuseBox.init({
    homeDir: "src",
    target: "browser@es6",
    output: "build/$name.js",
    useTypescriptCompiler: true,
    plugins: [
      WebIndexPlugin({ template: "src/index.html" }),
      RawPlugin([".vert", ".frag"]),
      JSONPlugin(),
      ReplacePlugin({
        CANVAS_RENDERER: JSON.stringify(true),
        WEBGL_RENDERER: JSON.stringify(true)
      })
      //prod && QuantumPlugin({ uglify: true })
    ]
  });
}

function prod() {
  const fuse = init(true);
  fuse.bundle("app").instructions("> index.js");
  Sparky.task("clean", () => {
    return Sparky.src("build").clean("build");
  });
  Sparky.task("watch:images", () => {
    return Sparky.watch("**/*.+(svg|png|jpg|gif)", { base: "./src" }).dest(
      "./build"
    );
  });
  fuse.run();
}
