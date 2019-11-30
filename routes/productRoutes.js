const mongoose = require('mongoose');
const User = mongoose.model('User');
const Product = mongoose.model('Product');
const sh = require('shorthash');

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
  });

  app.get('/api/settings/', (req, res)=>{
    User.findById(req.headers.authorization).lean().select('name phone email address').then((user)=>{
      res.send(user);
    });
  });

  app.post('/api/settings/', (req, res)=>{
    User.findById(req.headers.authorization).select('name email address').then((user)=>{
      const {name, email, address} = req.body;
      user.name = name;
      user.email = email;
      user.address = address;
      user.save();
      res.send(user);
    });
  })

}