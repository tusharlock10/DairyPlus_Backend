const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartItem = new Schema({
  product_id:{type:Schema.Types.ObjectId, 'ref':'Product'},
  name: String,
  amount: String,
  sub_total: Number,
  quantity: Number,
  selling_price: Number
})

const Order = new Schema({
  show_order_id: String, // this id just for showing on user's device
  cart_price: Number, // total price of all the items in the cart, it is with discount
  original_price:Number, // the cart price originally without discount
  user: {type:Schema.Types.ObjectId, ref:'User'},
  date_ordered: {type:Date},  // Date when the order is placed
  expected_date_of_delivery: {type:Date}, // estimated delivery date
  date_of_delivery: {type:Date}, // date when the order is actually delivered, if it is delivered
  is_delivered: {type:Boolean, default:false}, // is delivered or not
  status: {type:String, default:'upcoming'},  // upcomin/delivered/cancelled
  payment_method:String, // paypal, cash, cheque,
  isPaid: Boolean,
  fast_delivery: Boolean, // is order for fast delivery or not
  address: String,
  user_name: String,
  promo_code:{type:String, default:""},
  discount: {type:Number, default:0},
  phone: String,
  paymentId: String, // valid only for Paypal
  cart: [CartItem]
});

mongoose.model('Order', Order);