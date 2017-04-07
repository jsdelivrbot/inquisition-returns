/**
 * Loads API modules.
 */
const api = require('./main'),
  db = api.lib.database,
  log = api.lib.log;

/**
 * Exports function to initialize the API
 */
module.exports = function(app) {
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
}
