(function() {
  /**
   * Provide all database related to blog authors.
   */

  /**
   * Library imports
   */
  const api = require('./../main');
  const fn = api.lib.functions;
  const exporter = api.lib.exports;
  const Author = require('./../models/author');
  const Post = require('./../models/post');

  exporter.publicize(module, {

    /**
     * @param {!{
     *   authorKey: !string,
     * }} author - a models.Author instance
     * @return {void}
     */
    denormalize(author) {
      if (author) {
        Author.updatePost(author.toObject(), Post);
      }
    },

    /**
     * Add author to the database.
     * @param {!{body: {
     *  first: !string,
     *  last: !string,
     *  authorKey: !string,
     *  about: !string,
     * }}} req - HTTP Request
     * @param {!{send: !Function}} res - HTTP Response
     * @return {void}
     */
    add(req, res) {
      fn.retry(() => {
        Author(req.body).save((err, author) => {
          this.denormalize(author);
          fn.resolve(err, res);
        });
      }, 3);
    },

    /**
     * Update an existing author
     * @param {!{params: {
     *  id: !string
     * }}} req - HTTP Request
     * @param {!{send: !Function}} res - HTTP Response
     * @return {void}
     */
    get(req, res){
      Author.findOne(
          {authorKey: req.params.id}, 
          {_id: 0, __v: 0}, 
          (err, author) => {
        err = err || !author;
        fn.resolve(err, res, author);
      });
    },

    /**
     * Update an existing author
     * @param {!{params: {
     *  id: !string
     * }}} req - HTTP Request
     * @param {!{send: !Function}} res - HTTP Response
     * @return {void}
     */
    put(req, res){
      const updateObj = Object.assign({}, req.body);
      delete updateObj.authorKey;  // remove unmodifiable field
      Author.findOneAndUpdate({authorKey: req.params.id}, updateObj, (err, author) => {
        this.denormalize(author);
        fn.resolve(err, res);
      });
    },

    getEndPoints() {
      return {
        post: [
          {
            path: '/author',
            title: 'Add new author',
            handler: this.add.bind(this),
            auth: true,
          },
        ],
        get: [
          {
            path: '/author/:id',
            title: 'Get author',
            handler: this.get.bind(this),
          },
        ],
        put: [
          {
            path: '/author/:id',
            title: 'Modify author',
            handler: this.put.bind(this),
            auth: true,
          },
        ],
      };
    }
  });
})();
