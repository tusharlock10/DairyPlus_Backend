const mongoose = require('mongoose');
const axios = require('axios')
const User = mongoose.model('User');

var OTPObject = {} // store all otp currently in use

const sendOTPMessage = (phone, otp) => {
  const OTP_URL = "https://control.msg91.com/api/verifyRequestOTP.php";
  const VERIFY_OTP_URL_PARAMS = {
    authkey: OTP_API_KEY,
    country: 91,
  };
  axios.default.get(OTP_URL, {
    params: {
      ...VERIFY_OTP_URL_PARAMS,
      mobile: phone,
      otp,
    },
  });
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