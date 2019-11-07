const mongoose = require('mongoose');
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');
const { Schema } = mongoose;


const Product = new Schema({
  topic: String,
  category: String,
  image: String,
  views: {type:Number, default:0},
  user: { type: Schema.Types.ObjectId, ref: 'User' },   // ref to user who wrote this article
  rating: {type: Number, default: 0},
  date_created: {type:Date, default:Date.now()},
  cards: [Card],  // sub-document for cards
  comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}] // refs to comments
});

Article.plugin(mongoose_fuzzy_searching, {fields: ['topic']});
mongoose.model('Article', Article);
