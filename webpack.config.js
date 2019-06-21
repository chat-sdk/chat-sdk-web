const path = require('path');
const webpack = require('webpack');


module.exports = {
 	entry: './app/js/app/app.ts',
// 	entry: './app/js/main/main.js',
	module: {
    	rules: [
      		{ test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      		{ test: /\.css$/, use: 'css-loader' },
//       		{ test: require.resolve('jquery'), use: [
//       			{ loader: 'expose-loader', options: 'jQuery'},
//       			{ loader: 'expose-loader', options: '$' }
//       		]}
    	]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    path: path.resolve(__dirname, 'app/dist/js'),
    filename: 'chat-sdk.js'
  },
  optimization: {
  	splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            chunks: "initial",
          },
        },
      },
  },
  watch: true,
  mode: 'none',
  plugins: [
    new webpack.DefinePlugin({

    }),
    new webpack.ProvidePlugin({
    	"window.jQuery": "jquery",
    	$: "jquery",
        jQuery: "jquery",
        jquery: "jquery",
    })
  ]
}