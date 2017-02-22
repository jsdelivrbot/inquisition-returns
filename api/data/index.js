(function() {
  const api = require('./../main'),
    args = api.lib.args,
    packager = api.lib.packager,
    log = api.lib.log;
  const ejs = require('ejs');
  const fs = require('fs');
  const Author = require('./../models/author');
  const Post = require('./../models/post');
  const search = require('./../endpoints/search');
  const shell = require('shelljs');
  const watch = require('node-watch');

  const WATCH_MAP = {};

  const ENCODING = 'utf8';
  const TEMPLATE = fs.readFileSync(`${__dirname}/post.tmpl`, ENCODING);
  const WATCH_FOLDER = __dirname + '/../../posts';

  /**
   * @param {Regex} pattern - regex to filter files
   * @param {Function} fn - the callback function
   * @return {Function} filter function
   */
  function filter(pattern, fn) {
    return function(filename) {
      if (pattern.test(filename)) {
        fn(filename);
      }
    };
  }

  /**
   * Transform markdown to a post object.
   * @param {string} content - plain Markdown content
   * @return {{md: string}} - blog content as an object
   */
  function mdToPost(content) {
    const propRegex = /<!--properties[\s\S]*-->/i;
    const prop = content.match(propRegex);
    let latestKey;
    let post = {};
    if (prop) {
      const lines = prop[0].split('\n');
      lines.forEach(function(line) {
        const info = line.split('=');
        if (line.indexOf('=') > -1) {
          const key = info[0].trim();
          try {
            post[key] = JSON.parse(info[1].trim());
          }
          catch (e) {
            post[key] = info[1].trim();
          }
          latestKey = key;
        }
        else if (latestKey && post[latestKey] && info[0].indexOf('-->') < 0) {
          post[latestKey] += ' ' + info[0].trim();
        }
      });
    }
    let md = content.replace(propRegex, '');
    const firstHeader = md.indexOf('#');
    md = firstHeader === -1 ? md : md.substr(firstHeader);
    post.md = md.replace(/\n$/, '');  // last line break
    return post;
  }

  /**
   * @param {string} filename - file to sync
   * @return {Promise<string>} - name of the file synced
   */
  function syncFile(filename) {
    return new Promise((resolve, reject) => {
      try {
        if (!WATCH_MAP[filename]) {
          WATCH_MAP[filename] = true;

          const content = fs.readFileSync(filename, ENCODING);
          const post = mdToPost(content);
          const query = {id: post.id};
          const options = {upsert: true, runValidators: true};

          Post.findOneAndUpdate(query, post, options,  (err, doc) => {
            if (err || !doc) {
              log.debug(post.title);
              reject(err);
            }
            else {
              doc.save().then(post => {
                fs.writeFile(
                  filename, ejs.render(TEMPLATE, post), ENCODING, () => {
                    log.info('update file %s', filename);
                    Post.denormalize(post, search);
                    Author.addInfo(post);
                    setTimeout(() => resolve(filename), 1000);
                });
              }).catch(e => reject(e));
            }
          });
        }
      }
      catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @param {string} filename - file to sync
   * @return {void}
   */
  function syncChange(filename) {
    syncFile(filename).then(() => {
      delete WATCH_MAP[filename];
      // Sync changes
      shell.cd(WATCH_FOLDER);
      log.debug('Syncing posts found under %s', shell.process.cwd());
      if(shell.exec(`git commit -am 'updated ${filename}'`).code !== 0) {
        log.error('commit failed');
      }
      if (shell.exec('git push').code !== 0) {
        log.error('pushed failed');
      }

      // Go back to current folder
      shell.cd(__dirname);
      log.debug('Done with sync');
    }).catch(e => {
      log.error('Error %s', e);
      delete WATCH_MAP[filename];
    });
  }

  if (!shell.which('git')) {
    log.error('Sorry, this script requires git');
    process.exit(1);
  }

  if (args.options.sync) {
    for (const filename of packager.getFiles(WATCH_FOLDER)) {
      syncFile(filename);
    }
  }

  if (args.options.start) {
    watch(WATCH_FOLDER, filter(/\.md$/, syncChange));
  }
})();
