const engines = require("consolidate");
const paypal = require("paypal-rest-sdk");
const sh = require('shorthash');
const axios = require("axios");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Product = mongoose.model("Product");
const Order = mongoose.model("Order");

const CLIENT_ID =
  "ASk50VeYdtGqeB2f3Y1TIYbd57ZYL1-XTxWaCbiak2JRCRieXzj4i1c-Sgz0iCbnw-UkIzab8FA3RvLX";
const CLIENT_SECRET =
  "EK_lRDcFylwbYk26nsWR9zvdM0qLMSTvtxl_3XPVPC9XhnAwC5XxYRezl_CaKvAeJjeYaWrSkahOiLwh";
const CURRENCY = "CAD";
var current_payments = {}

const RETURL_URL = "https://dairy-plus.herokuapp.com/api/payment/paypal/success/";
const CANCEL_URL = "https://dairy-plus.herokuapp.com/payment/paypal/cancel/";
// const RETURL_URL = "http://192.168.0.103:8000/api/payment/paypal/success/";
// const CANCEL_URL = "http://192.168.0.103:8000/payment/paypal/cancel/"


paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET
});

module.exports = app => {
  app.engine("ejs", engines.ejs);
  app.set("view engine", "ejs");

  app.post("/api/savecart/", (req, res) => {
    const { cart, grand_total } = req.body;
    User.findById(req.headers.authorization)
      .select("cart cart_price address")
      .then(user => {
        user.cart = cart;
        user.cart_price = grand_total;
        user.save();
        res.send({ address:user.address });
    });
  });

  app.get("/api/payment/paypal/", (req, res) => {
    User.findById(req.headers.authorization)
      .lean()
      .select("cart cart_price")
      .then(cart => {
        console.log("Query: ", req.query);
        let new_items_list = [];
        if (req.query.fast === "1") {
          cart.cart_price += 25;
          new_items_list.push({name:"Fast Delivery", price:25, currency:CURRENCY, quantity:1})
        }
        //[{name, amount, quantity, selling_price}] to [{name, sku:amount, price:selling_price, quantity }]
        cart.cart.map(item => {
          new_obj = {
            name: item.name,
            sku: item.amount,
            price: item.selling_price,
            quantity: item.quantity,
            currency:CURRENCY
          };
          new_items_list.push(new_obj);
        });

        var create_payment_json = {
          intent: "sale",
          payer: {
            payment_method: "paypal"
          },
          redirect_urls: {
            return_url: RETURL_URL,
            cancel_url: CANCEL_URL
          },
          transactions: [
            {
              transactions:[],
              item_list: {
                items: new_items_list
              },
              amount: {
                currency: CURRENCY,
                total: cart.cart_price
              },
              description: "This is the cart amount for Dairy Plus"
            }
          ]
        };

        paypal.payment.create(create_payment_json, function(error, payment) {
          if (error) {
            throw error;
          } else {
            // console.log("Create Payment Response");
            console.log(payment);
            current_payments[`${payment.id}`] = [cart.cart_price, req.headers.authorization, req.query.fast]
            res.redirect(payment.links[1].href);
          }
        });
      });
  });

  app.get("/api/payment/paypal/success/", (req, res) => {

    var PayerID = req.query.PayerID;
    var paymentId = req.query.paymentId;
    const current_payments_list = current_payments[`${paymentId}`]
    console.log("\n\nThis is paylemts list: ", current_payments_list)
    var execute_payment_json = {
      payer_id: PayerID,
      transactions: [
        {
          amount: {
            currency: CURRENCY,
            total: current_payments_list[0]
          }
        }
      ]
    };

    User.findById(current_payments_list[1]).then((user)=>{

      if (current_payments_list[2]==='1'){
        x = new Date()
        x.setDate(x.getDate()+2)
        expected_date_of_delivery =x
        fast_delivery = true
      }
      else{
        x = new Date()
        x.setDate(x.getDate()+4)
        expected_date_of_delivery =x
        fast_delivery = false
      }

      paypal.payment.execute(paymentId, execute_payment_json, function(
        error,
        payment
      ) {
        if (error) {
          console.log(error.response);
          throw error;
        } else {
          res.render("success");
          new_order = new Order({
            user: current_payments_list[1],
            cart_price: current_payments_list[0],
            address: user.address,
            user_name: user.user_name,
            phone: user.phone,
            expected_date_of_delivery,
            fast_delivery,
            cart: user.cart,
            paymentId,
            date_ordered: Date.now(),
            payment_method:'Paypal',
            isPaid: true,
          });
          new_order.show_order_id = sh.unique(new_order._id.toString());
          new_order.save();
          user.all_orders.push(new_order._id);
          user.incomplete_orders.push(new_order._id);
          user.cart_price = 0;
          user.cart = [];
          user.save();
          delete current_payments[`${paymentId}`]
        }
      });

    });
  });

  app.get("/api/payment/paypal/cancel/", (req, res) => {
    res.render("cancel");
  });

  app.post("/api/payment/offline/", (req, res) => {
    mode = req.body.mode
    fast_delivery = req.body.fast_delivery

    User.findById(req.headers.authorization).then((user)=>{
      cart_price = user.cart_price
      if (fast_delivery){
        x = new Date()
        x.setDate(x.getDate()+2)
        expected_date_of_delivery =x
        cart_price += 25
      }
      else{
        x = new Date()
        x.setDate(x.getDate()+4)
        expected_date_of_delivery =x
      }

      new_order = new Order({
        user: req.headers.authorization,
        cart_price,
        address: user.address,
        user_name: user.user_name,
        phone: user.phone,
        expected_date_of_delivery,
        fast_delivery,
        cart: user.cart,
        payment_method:mode,
        date_ordered:Date.now(),
        isPaid: false,
      });

      new_order.show_order_id = sh.unique(new_order._id.toString());
      new_order.save();
      user.all_orders.push(new_order._id);
      user.incomplete_orders.push(new_order._id);
      user.cart_price = 0;
      user.cart = [];
      user.save();
      res.send({successful:true})
    });
  })


};
