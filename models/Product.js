const mongoose = require('mongoose');
const { Schema } = mongoose;


const Type = new Schema({
  available_stock: Number,  // number of this particular amount product in stock
  amount: String, // means 100g or 1L or 500mL or 2kg etc. ["2kg", "1kg", "500g"],
  selling_price: Number,  // the price at which the product is sold
  cost_price: Number,  // cost of production o the product (difference of both should give the profit)
  total_units_sold: {type:Number, default:0},  // total number of this product ever sold
  is_deleted: {type:Boolean, default:false}  //is product available to see to the customer
}, {_id:false})

const Product = new Schema({
  name:String,
  image: String,
  description: String, // a small description of the product
  product_types: [Type],  // types of product in a list  
  
});

mongoose.model('Product', Product);