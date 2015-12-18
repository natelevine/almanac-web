import express from 'express';
import config from '../config';
import chalk from 'chalk';
import Redis from 'ioredis';
import path from 'path';

const app = express();
const client = new Redis(6379, 'data-cache');

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

app.get('/api/news', function (req, res) {
  client.keys('*', (err, keys) => {
    if (err) res.sendStatus(404);

    const pipeline = client.pipeline();

    keys.forEach( key => {
      pipeline.hgetall(key);
    });

    pipeline.exec( (error, result) => {
      res.send(result);
    });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname + '/../dist/index.html'));
});

export default app;
