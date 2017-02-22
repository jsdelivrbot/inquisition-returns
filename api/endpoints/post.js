(function() {
  /**
   * Provide all database related to blog posts.
   */

  /**
   * Library imports
   */
  const search = require('./search');
  const api = require('./../main');
  const db = api.lib.database;
  const fn = api.lib.functions;
  const exporter = api.lib.exports;
  const Post = require('./../models/post');

  const TABLE = 'posts';

  exporter.publicize(module, {
    /**
     * @param {Object} post - a model.Post instance
     * @return {void}
     */
    denormalize(post) {
      if (post) {
        Post.denormalize(post, search);
        Author.addInfo(post);
      }
    },

    /**
     * Add post to the database.
     * @param {!{body: {
     *  title: !string,
     *  summary: !string,
     *  authorKey: !string,
     *  md: !string
     * }}} req - HTTP Request
     * @param {!{send: !Function}} res - HTTP Response
     * @return {void}
     */
    add(req, res) {
      fn.retry(() => {
        Post(req.body).save((err, post) => {
          this.denormalize(post);
          fn.resolve(err, res);
        });
      }, 3);
    },

    /**
     * Update an existing post
     * @param {!{params: {
     *  id: !string
     * }}} req - HTTP Request
     * @param {!{send: !Function}} res - HTTP Response
     * @return {void}
     */
    get(req, res){
      Post.findOne({id: req.params.id}, (err, post) => {
        err = err || !post;
        return fn.resolve(err, res, post);
      });
    },

    /**
     * Update an existing post
     * @param {!{params: {
     *  id: !string
     * }}} req - HTTP Request
     * @param {!{send: !Function}} res - HTTP Response
     * @return {void}
     */
    meta(req, res){
      const selector = {image: 1, summary: 1, title: 1};
      Post.findOne({id: req.params.id}, selector, (err, post) => {
        err = err || !post;
        return fn.resolve(err, res, post);
      });
    },

    /**
     * Update an existing post
     * @param {!Object} req - HTTP Request
     * @param {!{send: !Function}} res - HTTP Response
     * @return {void}
     */
    getIds(req, res){
      Post.find({}, {id: 1}, (err, docs) => {
        err = err || !docs;
        docs = (docs || []).map(x => x.id);
        return fn.resolve(err, res, docs);
      });
    },

    /**
     * Update an existing post
     * @param {!{params: {
     *  id: !string
     * }}} req - HTTP Request
     * @param {!{send: !Function}} res - HTTP Response
     * @return {void}
     */
    peak(req, res){
      Post.find({}, {id: 1}, (err, docs) => {
        err = err || !docs;
        return fn.resolve(err, res, docs);
      });
    },

    /**
     * Update an existing post
     * @param {!{params: {
     *  id: !string
     * }}} req - HTTP Request
     * @param {!{send: !Function}} res - HTTP Response
     * @return {void}
     */
    put(req, res){
      const updateObj = Object.assign({}, req.body);
      delete updateObj.id;  // remove unmodifiable field
      Post.findOneAndUpdate({id: req.params.id}, updateObj, (err, post) => {
        this.denormalize(post);
        fn.resolve(err, res);
      });
    },

    /**
     * @param {!{body: !{
     *  id: !string,
     * }}} req - HTTP Request
     * @param {!{send: !Function}} res - HTTP Response
     * @return {void}
     */
    remove(req, res){
      const args = req.body;
      db.remove(TABLE, {id: args.id}).then(() => {
        this.getPosts(function(response) {
          this.send(res, response);
        });
        search.unmap(args.id);
      });
    },

    /**
     * @param {!{params: !{
     *  page: !string,
     * }}} req - HTTP Request
     * @param {!{send: !Function}} res - HTTP Response
     * @return {void}
     */
    paginate(req, res){
      Post.find(
          {publish: true},
          {_id: 0, id: 1, summary: 1, publishDate: 1, title: 1},
          (err, docs) => {
            response = [];
            if (docs) {
              const page = req.params.page;
              const slice = page === '1' ? 11 : 10;
              docs.sort((a, b) => {
                const aSort = ((a || {}).publishDate || {}).getTime() || 0;
                const bSort = ((b || {}).publishDate || {}).getTime() || 0;
                return aSort - bSort;
              });
              response = fn.paginate(docs, req.params.page, slice, false, true);
            }
            fn.resolve(err, res, response);
          });
    },

    getEndPoints() {
      return {
        post: [
          {
            path: '/post',
            title: 'Add New Post',
            handler: this.add.bind(this),
            auth: true,
          },
        ],
        get: [
          {
            path: '/post/ids',
            title: 'Get Post Ids',
            handler: this.getIds.bind(this),
            responsePath: './docs/ids-response.json',
          },
          {
            path: '/post/peak',
            title: 'Get Latest Post',
            handler: this.peak.bind(this),
            responsePath: './docs/peak-response.json',
          },
          {
            path: '/post/:id',
            title: 'Get Post',
            handler: this.get.bind(this),
            responsePath: './docs/post-response.json',
          },
          {
            path: '/post/meta/:id',
            title: 'Get Post Info',
            handler: this.meta.bind(this),
            responsePath: './docs/meta-response.json',
          },
          {
            path: '/posts/:page',
            title: 'Get Post (pgaination)',
            handler: this.paginate.bind(this),
            responsePath: './docs/page-response.json',
          },
        ],
        put: [
          {
            path: '/post/:id',
            title: 'Modify Post',
            handler: this.put.bind(this),
            auth: true,
          },
        ],
      };
    }
  });
})();
