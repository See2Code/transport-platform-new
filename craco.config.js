const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  webpack: {
    plugins: {
      add: [
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerHost: 'localhost',
          analyzerPort: 8888,
          reportFilename: 'report.html',
          defaultSizes: 'gzip',
          openAnalyzer: true,
          generateStatsFile: true,
          statsFilename: 'stats.json',
          statsOptions: null,
          logLevel: 'info'
        })
      ]
    }
  }
}; 