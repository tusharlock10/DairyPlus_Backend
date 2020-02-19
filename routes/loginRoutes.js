const mongoose = require('mongoose');
const User = mongoose.model('User');

var OTPObject = {} // store all otp currently in use

const sendOTPMessage = (phone, otp) => {
  const OTP_URL = "https://rest.nexmo.com/sms/json";
  const COUNTRY_CODE = "91";
  const message = {
    "api_key":"b63fdec0",
    "api_secret": "oBFcbI6bEZsRrtCr",
    "to": COUNTRY_CODE+phone,
    "text": "Your OTP for Dairy Plus is: "+otp,
    "from": "Dairy Plus"
  }
  axios.post(OTP_URL, message);
  // console.log("OTP sent is: ", otp)
}

module.exports = (app) => {
  app.post('/api/login/', (req, res)=>{
    const user_data = req.body;
    const {phone, otp} = user_data

    User.findOne({phone}).lean().then((user)=>{
      if (!user){
        res.send({error: "User not found, please go back and register"})
      }
      else{
        if (otp){
          if (OTPObject[phone]===otp && otp.length===4){
            res.send({token: user._id});
            delete OTPObject[phone]
          }
          else{
            res.send({error:"OTP is incorrect"})
          }
        }
        else{
          const new_otp = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
          sendOTPMessage(phone, new_otp);
          res.send({status: "OTP sent to "+phone});
          OTPObject[phone] = new_otp
        }
      }
    });
  });

  app.post('/api/register/', (req, res) => {
    const user_data = req.body;
    const {name, email, phone, otp, address} = user_data

    User.findOne({phone}).lean().then((user)=>{
      if (user){
        res.send({error: "User already exists, please go back and login"})
      }
      else{
        if (otp){
          if (OTPObject[phone]===otp && otp.length===4){
            const new_user = new User({
              name,
              email,
              address,
              phone,
            });
            new_user.save()
            res.send({token: new_user._id});
            delete OTPObject[phone]
          }
          else{
            res.send({error:"OTP is incorrect"})
          }
        }
        else{
          const new_otp = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
          sendOTPMessage(phone, new_otp);
          res.send({status: "OTP sent to "+phone});
          OTPObject[phone] = new_otp
        }
      }
    });

  })
}