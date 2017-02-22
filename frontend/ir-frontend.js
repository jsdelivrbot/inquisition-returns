(function() {
  /**
   * Main file for wspecs application.
   */
  var frontend = require('./main');
  var fs = frontend.fs;
  var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  var router = require('./router');

  /**
   * Start web app.
   */
  frontend.start(config, router);
})();
