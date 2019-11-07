const express = require('express');
const app = express();
const http = require('http').Server(app);
const mongoose = require('mongoose');

console.log("here before /")
app.get("/", (req, res) => {
  console.log("In get")
  res.send({hello:true});
})


const PORT = process.env.PORT || 8000
http.listen(PORT,()=>{
  console.log("listening")
})