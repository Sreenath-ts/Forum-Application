const mongoose = require('mongoose')
const {Types} = require('mongoose')
const validator = require('validator')

const answerSchema = mongoose.Schema({
    question:{
        type:Types.ObjectId,
        ref:'Question',
        index:true,
    },
    answer:{
        type:[{
            body:String,
            date:{
                type:Date,
                
            },
            user:{
                type:Types.ObjectId,
                ref:'User'
            },
            reactions:{
                type:Number,
                default:0
            }
        }],
        default:[]
    },
    upVotes:{type:[{
        user:{
            type:Types.ObjectId,
            ref:'User'
        },
        answer:{
            type:Types.ObjectId,
            ref:'Answer'
        }
    }],
default:[]},
downVotes:{type:[{
    user:{
        type:Types.ObjectId,
        ref:'User'
    },
    answer:{
        type:Types.ObjectId,
        ref:'Answer'
    }
}],
default:[]},

})
answerSchema.methods.addAnswer = function (answer) {
    this.answer.push(answer);

    console.log('emitted mongoose $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$4');
    this.emit('answer', answer);
    return this.answer.length;
  };
module.exports=  mongoose.model('Answer',answerSchema)