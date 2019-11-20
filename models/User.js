const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartItem = new Schema({
  product_id:{type:Schema.Types.ObjectId, 'ref':'Product'},
  product_name: String,
  product_category: String,
  quantity: Number,
  sub_total_amount: Number
})

const User = new Schema({
  name: String,
  phone: String,
  email: String,
  address:String,
  cart: [CartItem],
  total_items_ordered: {type:Number, default:0},
  all_orders: [{type:Schema.Types.ObjectId, ref:'Order'}],
  incomplete_orders: [{type:Schema.Types.ObjectId, ref:'Order'}]
});

mongoose.model('User', User);
