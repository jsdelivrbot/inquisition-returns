(function() {

  /**
   * Import Libraries.
   */
  const api = require('./../main');
  const search = api.lib.search;
  const exporter = api.lib.exports;
  const removeMd = require('remove-markdown');

  exporter.publicize(module, {
    searchBlog(req, res) {
      if (!req.params.query) {
        res.send([]);
      }
      else {
        search.search(req.params.query).then((data) => {
          res.send(data);
        });
      }
    },

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
    getSearchMap(post) {
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
    },

    /**
     * @param {!{publish: boolean}} post - models.Post instance
     * @return {void}
     */
    map(post) {
      if (post.publish)
        search.mapAll([this.getSearchMap(post)]);
      else
        this.unmap(post.id);
    },

    /**
     * @param {string} id - ID for the post to map.
     * @return {void}
     */
    unmap(id) {
      search.unmap(id);
    },

    /**
     * Modules endpoints
     * @return {void}
     */
    getEndPoints() {
      return {
        get: [
          {
            path: '/search',
            title: 'Search (empy)',
            handler: this.searchBlog.bind(this),
            response: '[]',
          },
          {
            path: '/search/:query',
            sample: '/search/topic',
            title: 'Search',
            handler: this.searchBlog.bind(this),
            responsePath: './docs/search-response.json',
          },
        ],
      };
    },
  });
})();
