const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartItem = new Schema({
  product_id:{type:Schema.Types.ObjectId, 'ref':'Product'},
  name: String,
  amount: String,
  sub_total: String,
  quantity: Number,
  selling_price: Number
})

const User = new Schema({
  name: String,
  phone: String,
  email: String,
  address:String,
  cart_price: Number,
  cart: [CartItem],
  promo_code:{type:String, default:""},
  discount: {type:Number, default:0},
  isAdmin: {type:Boolean, default:false},
  last_used: {type:Date},
  isPartialAdmin: {type:Boolean, default:false},
  all_orders: [{type:Schema.Types.ObjectId, ref:'Order'}],
  incomplete_orders: [{type:Schema.Types.ObjectId, ref:'Order'}],
  completed_orders: [{type:Schema.Types.ObjectId, 'ref':'Order'}]
});

mongoose.model('User', User);
