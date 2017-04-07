const randomstring = require('randomstring');
const api = require('./../main'),
  exporter = api.lib.exports,
  log = api.lib.log,
  mongoose = api.lib.database.mongoose,
  Schema = mongoose.Schema;

const MODEL_NAME = 'Post';

let schema = new Schema({
  id: {
    type: String,
    unique: true,
    default: randomstring.generate(10),
  },
  title: {
    type: String,
    required: true,
    unique: true,
  },
  author: {
    first: String,
    last: String,
    about: String,
    image: String,
    sm: {
      type: Object,
      default: {},
    }
  },
  authorKey: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  image: String,
  quote: {
    type: String,
    default: ''
  },
  md: {
    type: String,
    required: true,
  },
  publish: {
    type: Boolean,
    default: false,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  publishDate: {
    type: Date,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  prev: {
    id: String,
    title: String,
  },
  next: {
    id: String,
    title: String,
  },
});

schema.pre('save', function(next) {
  this.updated = Date.now();
  if (this.publish && !this.publishDate) {
    this.publishDate = this.created;
  }
  log.debug('Saving post %s', this.id);
  next();
});

schema.methods.addSearch = function(mapper) {
  return mapper.map(this.toObject());
};

schema.statics.connect = function(prev, next) {
  prev = prev || {};
  next = next || {};
  this.findOne({id: prev.id}, (err, doc) => {
    if (doc) {
      log.debug('connecting %s with %s', prev.id, next.id);
      doc.next = next;
      doc.save();
    }
    this.findOne({id: next.id}, (err, doc2) => {
      if (doc2) {
        log.debug('connecting %s with %s', next.id, prev.id);
        doc2.prev = prev;
        doc2.save();
      }
    });
  });
}

schema.statics.denormalize = function(post, mapper) {
  log.debug('Denormalizing post %s', post.id);
  if (mapper) {
    post.addSearch(mapper);
  }
  if (post.publish) {
    post.publishDate = post.publishDate || post.created;
    this.find({publish: true}, {_id: 0, title: 1, id: 1, publishDate: 1}, (err, docs) => {
      docs.sort((x, y) => x.publishDate > y.publishDate);
      const index = docs.findIndex(x => x.title === post.title);
      this.connect(docs[index-1], docs[index]);
      this.connect(docs[index], docs[index+1]);
    });
  }
};

module.exports = mongoose.model(MODEL_NAME, schema);
