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
  const watch = require('node-watch');

  const WATCH_MAP = {};

  const ENCODING = 'utf8';
  const TEMPLATE = fs.readFileSync(`${__dirname}/post.tmpl`, ENCODING);
  const WATCH_FOLDER = __dirname + '/../../posts';

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

  function syncChange(filename) {
    syncFile(filename).then(() => {
      delete WATCH_MAP[filename];
    }).catch(e => {
      log.error(e);
      delete WATCH_MAP[filename];
    });
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
