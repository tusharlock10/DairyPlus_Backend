const mongoose = require('mongoose');
const Order = mongoose.model('Order');


module.exports = (app) => {

  app.get('/api/getincompleteorders/', (req, res)=>{
    Order.find({user: req.headers.authorization, is_delivered:false}).lean().then((orders)=>{
      res.send({orders});
    })
  });

  app.get('/api/getcompletedorders/', (req, res)=>{
    Order.find({user: req.headers.authorization, is_delivered:true}).lean().then((orders)=>{
      res.send({orders});
    })
  });
  x = new Date().toISOString()

}