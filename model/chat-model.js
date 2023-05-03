const mongoose = require('mongoose')
const {Types} = require('mongoose')
const validator = require('validator')

const chatScheme = mongoose.Schema({
   name:{type:String,
    index:true,
},
   messages:{type:[{
    user:{
        type:Types.ObjectId,
        ref:'User'
    },
    message:{
        msg: mongoose.Schema.Types.Mixed,
        contentType:String
    },
    date:{
        type:Date,
        default:Date.now()
    }
   }],
   default:[]
}
})

module.exports=  mongoose.model('Chat',chatScheme)