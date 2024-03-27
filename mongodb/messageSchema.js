const mongoose=require('mongoose')
const chats=new mongoose.Schema({
    id:String,
    room:[
       {
        user:String,
        roomId:String
       }
    ],
    chats:[
        {
            roomId:String,
            chat:[
                {
                    id:String,Text:String,url:String,
                }
            ]
        }
    ]
})