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

const PROMO_CODES = {
  "XTREME10": 10, "FESTIVEOFF":30, "SPECIAL15":15, "DARYPLS20":20
} // in percentage eg. 10 means 10% discount on the cart_price but not including fast delivery fee


paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET
});

module.exports = app => {
  app.engine("ejs", engines.ejs);
  app.set("view engine", "ejs");

  app.post("/api/cart/promocode/", (req, res)=>{
    promo_code = req.body.promo_code.toUpperCase()
    if (PROMO_CODES[promo_code]){
      User.findById(req.headers.authorization).select('discount promo_code').then((user)=>{
        user.promo_code = promo_code;
        user.discount = PROMO_CODES[promo_code]
        user.save();
        res.send({discount:PROMO_CODES[promo_code]});
      });
    }
    else{
      User.findById(req.headers.authorization).select('discount promo_code').then((user)=>{
        user.promo_code = '';
        user.discount = 0
        user.save();
        if (promo_code==='##REMOVE##'){
          res.send({error:"Promo Code Removed"})
        }
        else{
          res.send({error:"Invalid Promo Code"})
        }
      });
    }
  })

  app.get("/api/cart/promocode/", (req, res)=>{
    User.findById(req.headers.authorization).lean().select('promo_code').then((user)=>{
      promo_code = user.promo_code
      discount = PROMO_CODES[promo_code]
      if (!discount){
        discount = 0
      }
      res.send({discount, promo_code});
    });
  })

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

  app.get("/api/speed/", (req, res)=>{
    t = Date.now();
    sum=0;
    while((Date.now()-t)<1000){
      sum++;
    }
    res.send((sum).toString())
  })

  app.get("/api/payment/paypal/", (req, res) => {
    User.findById(req.headers.authorization)
      .lean()
      .select("cart cart_price discount promo_code")
      .then(cart => {
        original_price = cart.cart_price
        discount_given = 0
        if (cart.discount!==0){
          discount_given = (cart.cart_price*cart.discount)/100
          cart.cart_price = cart.cart_price - discount_given
        }
        let new_items_list = [];
        if (req.query.fast === "1") {
          cart.cart_price += 25;
          original_price+=25;
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
                total: cart.cart_price,
                "details":{
                  "subtotal": original_price,
                  "discount": discount_given
                }
              },
              description: "This is the payment amount for Dairy Plus Cart"
            }
          ]
        };

        paypal.payment.create(create_payment_json, function(error, payment) {
          if (error) {
            throw error;
          } else {
            console.log(payment);
            current_payments[`${payment.id}`] = [cart.cart_price, req.headers.authorization, req.query.fast, original_price]
            res.redirect(payment.links[1].href);
          }
        });
      });
  });

  app.get("/api/payment/paypal/success/", (req, res) => {

    var PayerID = req.query.PayerID;
    var paymentId = req.query.paymentId;
    const current_payments_list = current_payments[`${paymentId}`]
    var original_price = current_payments_list[3]
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
            user_name: user.name,
            phone: user.phone,
            expected_date_of_delivery,
            fast_delivery,
            cart: user.cart,
            original_price,
            promo_code: user.promo_code,
            discount: user.discount,
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
          user.discount = 0;
          user.promo_code = "";
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
      let cart_price = user.cart_price
      let original_price = cart_price
      if (user.discount!==0){
        cart_price = cart_price - (cart_price*user.discount)/100
      }

      if (fast_delivery){
        x = new Date()
        x.setDate(x.getDate()+2)
        expected_date_of_delivery =x
        cart_price += 25
        original_price += 25
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
        user_name: user.name,
        phone: user.phone,
        expected_date_of_delivery,
        fast_delivery,
        cart: user.cart,
        original_price,
        promo_code: user.promo_code,
        discount: user.discount,
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
      user.promo_code = "",
      user.discount=0;
      user.save();
      res.send({successful:true})
    });
  });
};
