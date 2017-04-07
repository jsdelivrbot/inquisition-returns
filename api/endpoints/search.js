const api = require('./../main');
const search = api.lib.search;
const removeMd = require('remove-markdown');

/**
 * Update an existing post
 * @param {!{params: {
 *  query: string
 * }}} req - HTTP Request
 * @param {!{send: !Function}} res - HTTP Response
 * @return {void}
 */
function searchBlog(req, res) {
  if (!req.params.query) {
    res.send([]);
  }
  else {
    search.search(req.params.query).then((data) => {
      res.send(data);
    });
  }
}

/**
 * @param {!{md: string}} post - models.Post instance
 * @return {{
 *  title: string,
 *  paragraph: string,
 *  ref: string,
 *  created: string,
 *  result: Object
 * }} - A object to map to later search queries.
 */
function getSearchMap(post) {
  let text = removeMd(post.md);
  text = text.split('---')[0].replace(/\n/g, ' ');
  return {
    title: post.title,
    paragraph: text || post.summary,
    ref: post.id,
    result: {
      key: post.id,
      type: 'post',
      title: post.title,
      publishDate: post.publishDate,
      summary: post.summary
    }
  };
}

/**
 * @param {!{publish: boolean}} post - models.Post instance
 * @return {void}
 */
function map(post) {
  if (post.publish)
    search.mapAll([getSearchMap(post)]);
  else
    unmap(post.id);
}
module.exports.map = map;

/**
 * @param {string} id - ID for the post to map.
 * @return {void}
 */
function unmap(id) {
  search.unmap(id);
}
module.exports.unmap = unmap;

/**
 * Modules endpoints
 * @return {void}
 */
module.exports.getEndPoints = function () {
  return {
    get: [
      {
        path: '/search',
        title: 'Search (empy)',
        handler: searchBlog,
        response: '[]',
      },
      {
        path: '/search/:query',
        sample: '/search/topic',
        title: 'Search',
        handler: searchBlog,
        responsePath: './docs/search-response.json',
      },
    ],
  };
};
