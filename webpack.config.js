const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "public")
    },
    compress: true,
    hot: true,
    port: 8080
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|mp3)$/i,
        type: "asset/resource"
      }
    ]
  }
};
