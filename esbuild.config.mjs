import esbuild from "esbuild";
import fs from "fs";

const isWatch = process.argv.includes("--watch");
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));

const banner = `/*\nTHIS IS A GENERATED FILE - DO NOT EDIT\nNAME: ${manifest.name}\nID: ${manifest.id}\n*/`;

const options = {
  entryPoints: ["main.ts"],
  bundle: true,
  outfile: "main.js",
  target: "es2018",
  format: "cjs",
  banner: { js: banner },
  external: ["obsidian"],
  sourcemap: isWatch,
  minify: !isWatch,
  platform: "node"
};

async function build() {
  if (isWatch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log("Watching for changes...");
  } else {
    await esbuild.build(options);
    console.log("Build complete.");
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
