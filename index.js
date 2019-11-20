const express = require('express');
const app = express();
const http = require('http').Server(app);
const mongoose = require('mongoose');
const delay = require('delay');


require("./models/Product");
require('./models/User');
require('./models/Order');


process.on('uncaughtException', (e)=>{
  console.log("Got error:", e);
})

process.on('unhandledRejection', (e)=>{
  console.log("Got error:", e);
})

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/DairyPlus";
console.log('Connected to: ', mongoURI)
mongoose.connect(mongoURI, {useNewUrlParser: true});


const authTokenValidator = async (req, res, next) => {
  await delay(1000)
  const User = mongoose.model('User');
  console.log("req.url: ", req.url)

  if (!['/api/login/', '/api/register/', '/api/test/'].includes(req.url)){
    User.findById(req.headers.authorization).select("_id").lean().then((response) => {
      if (!response){
        res.send({error: "Invalid token"})
      }
      else{
        next();
      }
    })
  }
  else{
    next()
  }
}

app.use(express.json());
app.use(authTokenValidator);


// ROUTES
require('./routes/loginRoutes')(app)
require('./routes/productRoutes')(app)


console.log("here before /")
app.get("/", (req, res) => {
  console.log("In get")
  res.send({hello:true});
})


const PORT = process.env.PORT || 8000
http.listen(PORT,()=>{
  console.log("listening")
})