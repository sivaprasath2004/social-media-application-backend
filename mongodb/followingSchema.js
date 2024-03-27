const mongoose=require('mongoose')
const followers=new mongoose.Schema({
    following:[String],
    followers:[String],
    id:String
})
module.exports=mongoose.model('followers',followers)