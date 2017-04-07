const api = require('./../main');
const fn = api.lib.functions;
const Author = require('./../models/author');
const Post = require('./../models/post');


/**
 * @param {!{
 *   authorKey: !string,
 * }} author - a models.Author instance
 * @return {void}
 */
function denormalize(author) {
  if (author) {
    Author.updatePost(author.toObject(), Post);
  }
}
module.exports.denormalize = denormalize;

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
function add(req, res) {
  fn.retry(() => {
    Author(req.body).save((err, author) => {
      denormalize(author);
      fn.resolve(err, res);
    });
  }, 3);
}

/**
 * Update an existing author
 * @param {!{params: {
 *  id: !string
 * }}} req - HTTP Request
 * @param {!{send: !Function}} res - HTTP Response
 * @return {void}
 */
function get(req, res){
  Author.findOne(
      {authorKey: req.params.id}, 
      {_id: 0, __v: 0}, 
      (err, author) => {
    err = err || !author;
    fn.resolve(err, res, author);
  });
}

/**
 * Update an existing author
 * @param {!{params: {
 *  id: !string
 * }}} req - HTTP Request
 * @param {!{send: !Function}} res - HTTP Response
 * @return {void}
 */
function put(req, res){
  const updateObj = Object.assign({}, req.body);
  delete updateObj.authorKey;  // remove unmodifiable field
  Author.findOneAndUpdate({authorKey: req.params.id}, updateObj, (err, author) => {
    denormalize(author);
    fn.resolve(err, res);
  });
}

module.exports.getEndPoints = function() {
  return {
    post: [
      {
        path: '/author',
        title: 'Add new author',
        handler: add,
        auth: true,
      },
    ],
    get: [
      {
        path: '/author/:id',
        title: 'Get author',
        handler: get,
      },
    ],
    put: [
      {
        path: '/author/:id',
        title: 'Modify author',
        handler: put,
        auth: true,
      },
    ],
  };
};
