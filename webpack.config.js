const HtmlPlugin = require("html-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV,

  entry: "./src/index.tsx",

  output: {
    path: `${__dirname}/dist`,
    filename: "index.js",
    publicPath: "auto",
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
      },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
      {
        test: /\.(gif|png|jpg|eot|wof|woff|ttf|svg)$/,
        // 画像をBase64として取り込む
        type: "asset/inline",
      },
    ],
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },

  target: ["web", "es5"],

  plugins: [
    new HtmlPlugin({
      template: "./public/index.html",
    }),
  ],

  cache: {
    type: "filesystem",
    buildDependencies: {
      config: [__filename],
    },
  },

  devServer: {
    contentBase: `${__dirname}/dist`,
    port: 9000,
  },
};
