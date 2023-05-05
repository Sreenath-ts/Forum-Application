const User = require('../model/user-model')
const ObjectId = require('mongoose').Types.ObjectId;
const chatRooms  = require('../model/chat-model')

module.exports= {
    getChatRoom:(req, res, next) => {
        console.log('geting room..................................')
        let messages
        let room = req.params.room;
        chatRooms.findOne({name: room}).select({_id:0,'messages._id':0}).populate({  path: 'messages.user',
        select: '_id name'}).exec((err, chatroom) => {
            if(err) {
                console.log(err);
                return false;
            }
            if(chatroom && chatroom.messages.length>0){
             messages = chatroom.messages.map(message => ({
              user: message.user._id,
              userName: message.user.name,
              message:{msg:message.message.msg,contentType:message.message.contentType,date: message.date}
              
            }));
            console.log(messages);
           
          }
            res.status(200).json({data: chatroom.messages.length>0 ? messages : []  });
        });
    },
    chatRooms:async(req,res,next) =>{
      try {
        
        const user = req.user._id
        const email = req.user.email
        console.log(email)
    const chatrooms = await chatRooms.find({}).select({name:1,_id:0})
console.log(chatrooms,'chatrooms')
   chatrooms.forEach((element,i) => {
    if (element.name.includes(email)) {
      // If present, remove string2 from string1
      element.name = element.name.replace(email, "");
    }else{
      chatrooms.splice(i,1)
    }
   });
  
   const chatSample = await User.find({email:{$in:chatrooms.map(obj=> obj.name)}}).select({name:1,email:1}) 
   

    res.status(200).json({
        data:chatSample
    })

      } catch (error) {
        console.log(error);
      }
    }
}
