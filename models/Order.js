const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartItem = new Schema({
  product_id:{type:Schema.Types.ObjectId, 'ref':'Product'},
  product_name: String,
  number: Number,  // means number of these product ordered
  sub_total_amount: Number
})

const Order = new Schema({
  show_order_id: String, // this id just for showing on user's device
  total_amount: Number,
  date_ordered: {type:Date, default:Date.now()},  // Date when the order is placed
  expected_date_of_delivery: {type:Date}, // estimated delivery date
  date_of_delivery: {type:Date}, // date when the order is actually delivered, if it is delivered
  is_delivered: {type:Boolean, default:false},
  amount_without_tax: Number,
  payment_method:String,
  cart: [CartItem]
});

mongoose.model('Order', Order);