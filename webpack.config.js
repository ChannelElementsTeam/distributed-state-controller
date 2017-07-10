module.exports = {
  entry: "./src/index.ts",
  output: {
    filename: "distributed-state-controller.js",
    path: __dirname + "/dist/"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  }
}