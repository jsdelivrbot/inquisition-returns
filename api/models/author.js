const api = require('./../main'),
  log = api.lib.log;
const mongoose = api.lib.database.mongoose,
   Schema = mongoose.Schema;

const MODEL_NAME = 'Author';

let schema = new Schema({
  authorKey: {
    type: String,
    unique: true,
  },
  about: {
    type: String,
    required: true,
  },
  first: {
    type: String,
    required: true,
  },
  last: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    image: 'defaul.jpg',
  },
  sm: [Object],
});

schema.statics.addInfo = function(post) {
  this.findOne(
      {authorKey: post.authorKey}, 
      {_id: 0, __v: 0, authorKey: 0},
      (err, author) => {
        if (author) {
          log.debug('Udpating author info for post %s', post.id);
          post.author = author;
          post.save();
        }
      });
}

schema.statics.updatePost = function(author, post) {
  log.debug('Updating posts for author: %s', author.authorKey);
  const modAuthor = Object.assign({}, author);
  ['__v', '_id', 'authorKey'].forEach(key => {
    delete modAuthor[key];
  });
  post.find({authorKey: author.authorKey}, (err, docs) => {
    docs.forEach(doc => {
      log.debug('Udpating author info for post %s', doc.id);
      doc.author = modAuthor;
      doc.save();
    });
  });
};

module.exports = mongoose.model(MODEL_NAME, schema);
