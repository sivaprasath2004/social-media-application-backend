const mongoose=require('mongoose')
let login_schema=new mongoose.Schema({
  name:String,
  user_name:String,
  Email_id:String,
  Des:String,
  pass:String,
  following:[String],
  followers:[String],
  messages:[String]
})
module.exports=mongoose.model('login',login_schema)