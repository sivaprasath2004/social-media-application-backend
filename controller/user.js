require('dotenv').config();
const mongoose=require('mongoose')
const login_schema=require('../mongodb/loginschema')
const login=async(req,res)=>{
   try {
   await mongoose.connect(process.env.DB);
   let val= await login_schema.findOne({Email_id:req.body.email}) 
   if(val){
    if(val.pass===req.body.pass){
   res.status(200).send({res:'ok',user:val})
    }
    else{
    res.status(200).send({res:"error",user:'Invalid Password'})
    }
   }
   else{
    res.status(200).send({res:"error",user:'No more user found'})
   }
} catch (error) {
  console.error('Error connecting to MongoDB:', error);
}
  finally{
    await mongoose.disconnect()
  }
}
async function searchResult(req,res){
  console.log(req.body)
  try {
    await mongoose.connect(process.env.DB);
    let val= await login_schema.find({user_name:req.body.val}) 
    console.log(val)
  } catch (error) {
   console.error('Error connecting to MongoDB:', error);
 }
   finally{
     await mongoose.disconnect()
   }
}
const signup=async(req,res)=>{
  try {
     await mongoose.connect(process.env.DB);
     if(req.body.name && req.body.usernsme && req.body.email && req.body.pass){
   let val= await login_schema.findOne({Email_id:req.body.email}) 
    if(val){
    res.status(200).send({res:"error",user:'Already used in mail Adress'})
    }else{
      let username=await login_schema.findOne({user_name:req.body.username})
      if(username){
        res.status(200).send({res:"error",user:'Already User Name taken'})
      }
      else{
      let user=await login_schema.create({
        name:req.body.name,
        user_name:req.body.username,
        Email_id:req.body.email,
        Des:req.body.Des,
        pass:req.body.pass
      })
      res.status(200).send({res:"ok",user:user})
    }
  }
  }
  else{
    res.status(200).send({res:"error",user:'error'})
  }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
    finally{
      await mongoose.disconnect()
    }
}
module.exports={login,signup,searchResult}