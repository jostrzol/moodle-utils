import fs from "fs";
import path from "path";
import TerserPlugin from 'terser-webpack-plugin';
import webpack from "webpack";

const ENTRY = path.resolve(__dirname, "src/userscript-main.ts")
const OUT_DIR = path.resolve(__dirname, "dist")

const config: webpack.Configuration = {
  mode: 'production',
  entry: ENTRY,
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: /(\s@|UserScript==)/i,
          },
        }
      })
    ]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  output: {
    path: OUT_DIR,
  },
  resolve: {
    modules: [
      "node_modules",
      "src"
    ],
    extensions: [".ts", ".js"],
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: fs.readFileSync(ENTRY, "utf-8").replace(/(==\/UserScript==)[\s\S]+$/, "$1"),
      entryOnly: true,
      raw: true
    })
  ]
}

module.exports = (env: any, argv: any) => {
  let outInfix = ''

  if (argv.mode === 'development') {
    config.devtool = 'eval-source-map'
    outInfix = '.dev'
  }

  config.output!.filename = `script${outInfix}.user.js`

  return config;
};