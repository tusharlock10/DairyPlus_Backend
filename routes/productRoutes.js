const mongoose = require('mongoose');
const User = mongoose.model('User');
const Product = mongoose.model('Product');
const Order = mongoose.model('Order');
const sh = require('shorthash');

ADMIN_PHONE = ["9354527144", "9069988099"]

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
      if (ADMIN_PHONE.includes(user.phone)){
        user['isAdmin'] = true
      }
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

  app.get('/api/admin/', (req, res)=>{
    User.findById(req.headers.authorization).lean().select('phone').then((user)=>{
      if (!ADMIN_PHONE.includes(user.phone)){
        res.send("You are not authorized to do so")
      }
      else{
        Order.find({is_delivered: false}).lean().then((orders)=>{
          res.send(orders)
        })
      }
    })
  })

  app.post('/api/admin/delivered/', (req, res) => {
    User.findById(req.headers.authorization).lean().select('phone').then((user)=>{
      if (!ADMIN_PHONE.includes(user.phone)){
        res.send("You are not authorized to do so")
      }
      else{
        Order.findById(req.body.order_id).then((order) => {
          order.is_delivered = true;
          order.date_of_delivery = Date.now();
          order.status = "delivered";
          order.isPaid = true;

          order.save().then(()=>{res.send("Order is now delivered");})

        })
      }
    })
  })

}