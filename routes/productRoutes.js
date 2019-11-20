const mongoose = require('mongoose');
const User = mongoose.model('User');
const Product = mongoose.model('Product');


module.exports = (app) => {

  app.get('/api/getproducts/', (req, res)=>{
    Product.find({},).select('\
      -product_types.cost_price \
      -product_types.total_units_sold \
      -product_types.is_deleted'
    )
    .lean().then((response)=>{
      res.send(response)
    })
  })

}