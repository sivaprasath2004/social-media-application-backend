require('dotenv').config();
const mongoose=require('mongoose')
const login_schema=require('../mongodb/loginschema')
const follow=require('../mongodb/followingSchema')
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
    const regex = new RegExp(`.*${req.body.val}.*`, 'i')
    let val= await login_schema.find({user_name:regex}) 
    res.status(200).send(val)
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
     if(req.body.name && req.body.username && req.body.email && req.body.pass){
   let val= await login_schema.findOne({Email_id:req.body.email}) 
   console.log(val)
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
    await follow.create({
      _id:user._id,
      id:user._id
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
const following=async(req,res)=>{
  try{
    await mongoose.connect(process.env.DB);
    let users=await login_schema.find({})
    let arr=[]
    users.map(item=>{
        arr.push({
          _id:item._id,
          id:item.id,
        })
    })
    await follow.insertMany(arr)
    res.send("finish")
  }
  catch(err){
    console.log(err)
  }
  finally{
    await mongoose.disconnect()
  }
  }
const followers=async(me,you,name)=>{
  try{
    console.log(me,you,name)
    await mongoose.connect(process.env.DB);
    let chattingId=me+you
    let first=await follow.findById(me)
    let following=first.following.filter(item=>item!==you)
    let fir_messages=first.messages.filter(item=>item!==chattingId)
    fir_messages.push(chattingId)
    following.push(you)
    first.messages=fir_messages
    first.following=following
    let second=await follow.findById(you)
    let followers=second.followers.filter(item=>item!==me)
    let sec_messages=second.messages.filter(item=>item!==chattingId)
    sec_messages.push(chattingId)
    followers.push(me)
    second.followers=followers
    second.messages=sec_messages
   await first.save()
   await second.save()
   } catch (error) {
  console.error('Error connecting to MongoDB:', error);
   }
  finally{
    await mongoose.disconnect()
  }
}
module.exports={login,signup,searchResult,followers,following}