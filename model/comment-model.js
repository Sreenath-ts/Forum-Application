const mongoose = require('mongoose')
const {Types} = require('mongoose')

const commentSchema = mongoose.Schema({
    answer:{
        type:Types.ObjectId,
        ref:'Answer',
        index:true,
    },
    comments:{
        type:[{
            body:String,
            date:Date,
            user:{
                type:Types.ObjectId,
                ref:'User'
            },
            subcomments:{
                type:Types.ObjectId
            }
        }],
        default:[]
    },
  
})

module.exports=  mongoose.model('Comments',commentSchema)