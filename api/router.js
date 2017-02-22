(function() {
  /*
   * @desc Loads all endpoints for the api found under the enpdpoint/ directory
   * AUTO Generated file.
   */

  /**
   * Loads API modules.
   */
  const api = require('./main'),
    db = api.lib.database,
    log = api.lib.log;
  require('./data');

  /**
   * Exports function to initialize the API
   */
  api.lib.exports.publicize(module, (app) => {

    app.locals.authorize = function(user) {
      log.debug('Authorizing user: %s', user.name);
      return new Promise((resolve, reject) => {
        db.findOne('keys', {key: user.pass}).then(data => {
          if (data && data.write) {
            resolve({scope: data.scope});
          }
          else {
            reject();
          }
        }).catch(e => {
          reject(e);
        });
      });
    };

    app.initializeApi(__dirname);
  });
})();
