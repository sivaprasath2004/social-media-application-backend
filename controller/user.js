require('dotenv').config();
const mongoose=require('mongoose')
const login_schema=require('../mongodb/loginschema')
const login=async(req,res)=>{
   try {
   await mongoose.connect(process.env.DB);
   console.log(req,body)
} catch (error) {
  console.error('Error connecting to MongoDB:', error);
}
  
}
module.exports={login}