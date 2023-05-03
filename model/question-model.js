const mongoose = require('mongoose')
const {Types} = require('mongoose')
const validator = require('validator')

const questionSchema = mongoose.Schema({
    title:String,
    titleHtml:String,
    body:String,
    user:{
        type:Types.ObjectId,
        ref:'User'
    },
    tags:[],
    views:Number,
    upVotes:{
        type:[{
            user:{
                type:Types.ObjectId,
                ref:'User'
            }
        }],
        default:[]
    },
    downVotes:{
        type:[{
            user:{
                type:Types.ObjectId,
                ref:'User'
            }
        }],
        default:[]
    },
    report:{
        type:[{
            user:{
                type:Types.ObjectId,
                 ref:'User'
            },
            reason:String
        }],
        default:[]
    },
    reactions:{
        type:Number,
        default:0
    }
},{
    timeStamp:true
})

module.exports=  mongoose.model('Question',questionSchema)