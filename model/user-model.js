const mongoose = require('mongoose')
const validator = require('validator')
const schema = new mongoose.Schema({
name:{
    type:String,
    index:true,
    required:[true,'Please tell us your name!']
},
email:{
    type:String,
    required:[true,'Please provide your email'],
    unique:true,
    lowercase:true,
    index:true,
    validate:[validator.isEmail,'Please provide a valid email!']
},
photo:String,
password:{
    type:String,
    required:[true,'Please provide a password'],
    minlength:8,
    select:false
},
role:{
    type:String,
    enum:['user','admin'],
    default:'user'
},
access:{
    type:Boolean,
    default:true
},
validated:{
    type:Boolean,
    default:false
},
resetToken: String,
resetTokenExpiration: Date
})

module.exports=  mongoose.model('User',schema)



