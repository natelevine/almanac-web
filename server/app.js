import express              from 'express';
import historyApiFallback   from 'connect-history-api-fallback';
import config               from '../config';
import chalk                from 'chalk';

const app = express();

app.use(historyApiFallback({
  verbose : false
}));

// Enable webpack middleware if the application is being
// run in development mode.
if (config.get('globals').__DEV__) {
  const webpack       = require('webpack');
  const webpackConfig = require('../build/webpack/development_hot');
  const compiler      = webpack(webpackConfig);

  console.log(chalk.bold.red('Running server in __DEV__ env.'));

  app.use(require('./middleware/webpack-dev')({
    compiler,
    publicPath : webpackConfig.output.publicPath
  }));
  app.use(require('./middleware/webpack-hmr')({ compiler }));
}

// During production mode, spin up a proper Express server
if (config.get('globals').__PROD__) {
  // Linter will throw error for this console.log, please ignore
  console.log(chalk.bold.yellow('Running server in __PROD__ env.'));
  // Serve the static files from the 'dist' directory
  app.use(express.static('dist'));
}

export default app;
