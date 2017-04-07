const api = require('./../main');
const fn = api.lib.functions;
const Post = require('./../models/post');


/**
 * @param {!{params: !{
 *  page: !string,
 * }}} req - HTTP Request
 * @param {!{send: !Function}} res - HTTP Response
 * @return {void}
 */
function listPosts(req, res){
  const query = Post
    .find({publish: true})
    .select('id title author.first author.last created publish publishDate -_id')
    .sort({publishDate: -1});
  query.exec((err, docs) => {
    let response = [];
    if (docs) {
      const page = req.params.page;
      response = fn.paginate(docs, page, 10, false, true);
    }
    fn.resolve(err, res, response);
  });
}


module.exports.getEndPoints = function() {
  return {
    get: [
      {
        path: '/admin/posts/:page',
        title: 'Get Post',
        handler: listPosts,
      },
    ],
    put: [
    ],
  };
}
