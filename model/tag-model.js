const mongoose = require('mongoose')

const schema = mongoose.Schema({
    name:{
        type:String,
        unique:true,
        lowercase:true
    },
    description:String,
    img:String,
    questions:{
        type:Array,
        ref:'Question'
    },
    followers:{
        type:Array,
        ref:'User'
    },
    moderators:{
        type:Array,
        ref:"User"
    }
},{
    timeStamps:true
})

module.exports = mongoose.model('Tag',schema)