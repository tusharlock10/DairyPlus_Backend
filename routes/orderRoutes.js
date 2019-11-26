const mongoose = require('mongoose');
const User = mongoose.model('User');
const Product = mongoose.model('Product');
const Order = mongoose.model('Order');


module.exports = (app) => {

  app.get('/api/getincompletedorders/', (req, res)=>{
    Order.find({user: req.headers.authorization}).lean().then((orders)=>{
      res.send({orders});
    })
  });

}