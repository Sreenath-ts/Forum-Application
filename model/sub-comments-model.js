const mongoose = require('mongoose')
const {Types} = require('mongoose')

const subcommentSchema = mongoose.Schema({
    comment:{
        type:Types.ObjectId,
        index:true,
        ref:'Comments'
    },
    subcomments:{
        type:[{
            body:String,
            date:Date,
            user:{
                type:Types.ObjectId,
                ref:'User'
            }
        }]
    },
    default:[]
})

module.exports=  mongoose.model('SubComments',subcommentSchema)