const express = require('express');
const app = express();
const http = require('http').Server(app);
const mongoose = require('mongoose');


require("./models/Product");
require('./models/User');
require('./models/Order');

// app url: https://dairyplus.herokuapp.com/

process.on('uncaughtException', (e)=>{
  console.log("Got error:", e);
})

process.on('unhandledRejection', (e)=>{
  console.log("Got error:", e);
})

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/DairyPlus";
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true }, );


const authTokenValidator = async (req, res, next) => {
  // const User = mongoose.model('User');

  // if (!['/api/login/', '/api/register/', '/api/payment/paypal/cancel/','/api/payment/paypal/success/'].includes(req.url)){
  //   User.findById(req.headers.authorization).select("_id").lean().then((response) => {
  //     if (!response){
  //       res.send({error: "Invalid token"})
  //     }
  //     else{
  //       next();
  //     }
  //   })
  // }
  // else{
  //   next()
  // }
  next();
}

app.use(express.json());
app.use(authTokenValidator);


// ROUTES
require('./routes/loginRoutes')(app)
require('./routes/productRoutes')(app)
require('./routes/cartRoutes')(app)
require('./routes/orderRoutes')(app)



app.get("/", (req, res) => {
  res.send({hello:true});
})


const PORT = process.env.PORT || 8000
http.listen(PORT)