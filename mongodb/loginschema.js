const mongoose=require('mongoose')
let login_schema=new mongoose.Schema({
  name:String,
  dob:String,
  ph_no:Number,
  gender:String,
  Email_id:String,
  pass:String
})
module.exports=mongoose.model('login',login_schema)