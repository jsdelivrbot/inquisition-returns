const search = require('./search');
const api = require('./../main');
const fn = api.lib.functions;
const Post = require('./../models/post');
const Author = require('./../models/author');


/**
 * @param {Object} post - a model.Post instance
 * @return {void}
 */
function denormalize(post) {
  if (post) {
    Post.denormalize(post, search);
    Author.addInfo(post);
  }
}

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
function add(req, res) {
  fn.retry(() => {
    Post(req.body).save((err, post) => {
      denormalize(post);
      fn.resolve(err, res);
    });
  }, 3);
}

/**
 * Update an existing post
 * @param {!{params: {
 *  id: !string
 * }}} req - HTTP Request
 * @param {!{send: !Function}} res - HTTP Response
 * @return {void}
 */
function get(req, res){
  Post.findOne({id: req.params.id}, (err, post) => {
    err = err || !post;
    return fn.resolve(err, res, post);
  });
}

/**
 * Update an existing post
 * @param {!{params: {
 *  id: !string
 * }}} req - HTTP Request
 * @param {!{send: !Function}} res - HTTP Response
 * @return {void}
 */
function meta(req, res){
  const selector = {image: 1, summary: 1, title: 1};
  Post.findOne({id: req.params.id}, selector, (err, post) => {
    err = err || !post;
    return fn.resolve(err, res, post);
  });
}

/**
 * Update an existing post
 * @param {!Object} req - HTTP Request
 * @param {!{send: !Function}} res - HTTP Response
 * @return {void}
 */
function getIds(req, res){
  Post.find({}, {id: 1}, (err, docs) => {
    err = err || !docs;
    docs = (docs || []).map(x => x.id);
    return fn.resolve(err, res, docs);
  });
}

/**
 * Update an existing post
 * @param {!{params: {
 *  id: !string
 * }}} req - HTTP Request
 * @param {!{send: !Function}} res - HTTP Response
 * @return {void}
 */
function peak(req, res){
  const query = Post
    .find()
    .select('title summary author.first author.last publishDate -_id')
    .limit(3)
    .sort({publishDate: -1});
  query.exec((err, docs) => {
    err = err || !docs;
    return fn.resolve(err, res, docs);
  });
}

/**
 * Update an existing post
 * @param {!{params: {
 *  id: !string
 * }}} req - HTTP Request
 * @param {!{send: !Function}} res - HTTP Response
 * @return {void}
 */
function put(req, res){
  const updateObj = Object.assign({}, req.body);
  delete updateObj.id;  // remove unmodifiable field
  Post.findOneAndUpdate({id: req.params.id}, updateObj, (err, post) => {
    denormalize(post);
    fn.resolve(err, res);
  });
}


/**
 * @param {!{params: !{
 *  page: !string,
 * }}} req - HTTP Request
 * @param {!{send: !Function}} res - HTTP Response
 * @return {void}
 */
function paginate(req, res){
  const query = Post
    .find({publish: true})
    .select('id title summary publishDate -_id')
    .sort({publishDate: -1});
  query.exec((err, docs) => {
    let response = [];
    if (docs) {
      const page = req.params.page;
      const slice = page === '1' ? 11 : 10;
      response = fn.paginate(docs, page, slice, false, true);
    }
    fn.resolve(err, res, response);
  });
}

module.exports.getEndPoints = function() {
  return {
    post: [
      {
        path: '/post',
        title: 'Add New Post',
        handler: add,
        auth: true,
      },
    ],
    get: [
      {
        path: '/post/ids',
        title: 'Get Post Ids',
        handler: getIds,
        responsePath: './docs/ids-response.json',
      },
      {
        path: '/post/peak',
        title: 'Get Latest Post',
        handler: peak,
        responsePath: './docs/peak-response.json',
      },
      {
        path: '/post/:id',
        title: 'Get Post',
        handler: get,
        responsePath: './docs/post-response.json',
      },
      {
        path: '/post/meta/:id',
        title: 'Get Post Info',
        handler: meta,
        responsePath: './docs/meta-response.json',
      },
      {
        path: '/posts/:page',
        title: 'Get Post (pgaination)',
        handler: paginate,
        responsePath: './docs/page-response.json',
      },
    ],
    put: [
      {
        path: '/post/:id',
        title: 'Modify Post',
        handler: put,
        auth: true,
      },
    ],
  };
};
