const express = require('express');
const app = express();
const http = require('http').Server(app);
const mongoose = require('mongoose');

app.get("/", (req, res) => {
  res.send({hello:true});
})


const PORT = process.env.PORT || 8000
http.listen(PORT)