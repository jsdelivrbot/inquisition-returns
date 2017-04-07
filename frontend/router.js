(function () {
  /**
   * Handles routing for the application.
   */

  'use strict';

  const shell = require('shelljs');

  module.exports = function(app, root, appInfo, request, utils){
    appInfo.stickyHeader = false;
    appInfo.referrer = '#';

    function mainHandler(req, res) {
      var page = req.params.page || 1;
      request('/posts/' + page, res).then(data => {
        var tags = Object.assign({}, appInfo);
        tags.latest = data.start === 1 ? data.data.shift() : false;
        tags.recents = utils.groupArray(data.data || [], 2);
        tags.state = data;
        app.locals.render(res, 'main.ejs', tags);
      });
    }

    function blogHandler(req, res) {
      var id = req.params.id || 1;
      request('/post/' + id, res).then(data => {
        var tags = Object.assign({}, appInfo);
        tags.referrer = req.headers.referrer || req.headers.referer || '#';
        if (data.author && (data.image || '').indexOf('http') === -1) {
          data.author.image = `img/${data.author.image}`;
        }
        tags.post = data;
        tags.title = data.title;
        tags.description = data.summary;
        tags.image = data.image;
        tags.html = utils.mdToHtml(data.md);
        app.locals.render(res, 'post.ejs', tags);
      });
    }

    function searchHandler(req, res) {
      var query = req.params.query || '';
      request('/search/' + query, res).then(data => {
        if (data.length === 1) {
          res.redirect('/post/' + data[0].key);
          return;
        }
        var tags = Object.assign({}, appInfo);
        tags.referrer = req.headers.referrer || req.headers.referer || '#';
        tags.results = data;
        tags.stickyHeader = true;
        app.locals.render(res, 'search.ejs', tags);
      });
    }

    function syncHandler(req, res) {
      shell.cd(__dirname + '/..');
      shell.exec('git pull');
      shell.cd(__dirname);
      res.render('http-code-tmpl', {
        code: res.statusCode,
        info: 'Done',
        message: 'All synced up!',
      });
    }

    app.get(root + '/', mainHandler);
    app.get(root + '/posts', mainHandler);
    app.get(root + '/posts/:page', mainHandler);
    app.get(root + '/post/:id', blogHandler);
    app.get(root + '/search', searchHandler);
    app.get(root + '/search/:query', searchHandler);
    app.get(root + '/udpate', syncHandler);
    app.get(root + '/sync', syncHandler);
    app.get('*', (_, res) => {
      app.locals.notFound(res);
    });
  };
})();
