const Express =  require('express')
const Mongoose = require('mongoose')
const multer = require('multer')
const app = Express()
const path = require('path')
const socketIO = require('socket.io');
const chatRooms = require('./model/chat-model')
const fs = require("fs")
const exec = require("child_process").exec
const util = require("util");
const { pipeline } = require('stream');
const { promisify } = require("util");
const pipelineAsync = promisify(pipeline);
const {instrument} = require('@socket.io/admin-ui')
const userModel = require('./model/user-model')
require('dotenv').config()
try{
const cors = require('cors')

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});



const corsOptions = {
    origin: 'https://production--glittering-dodol-08c860.netlify.app' ,
    methods: 'GET, POST, PUT,PATCH,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  };

  app.use(cors({
    origin: 'https://glittering-dodol-08c860.netlify.app/'
  }));
  
const cookieParser = require('cookie-parser')

const userRouter = require('./routes/user')

const adminRouter = require('./routes/admin')

const db = Mongoose.connection
Mongoose.connect(process.env.DB)
db.on('open',()=>{
    console.log("Database Connected");
})

db.once('err',(err)=>{
    console.log(err,"DB connection Failed")
})

app.use(Express.static(path.join(__dirname,'public')))

app.use(Express.json())

app.use(Express.urlencoded({extended:true}))

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      console.log('destination,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,..................................')
      cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
      cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname)
    }
  })

  const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      console.log('if multer')
      cb(null, true)
    } else {
      console.log('else multer')
      cb(null, false)
    }
  }

  app.use(
    multer({ storage: fileStorage, fileFilter }).single('image')
  )




app.use(cookieParser())

// app.use(Express.urlencoded({extended:true}))

app.use('/',userRouter)

app.use('/admin',adminRouter)



const server = app.listen(3000,()=>{
    console.log("Server Started")
})

const io = socketIO(server, {
  cors: {
    origin: ["https://admin.socket.io","https://codemonk-ywey.onrender.com","https://glittering-dodol-08c860.netlify.app/"],
    credentials: true
  }
});

app.set('io',io)


let count;
const chunkSize = 128 * 1024; // 128kB chunk size, you can adjust this value

const Files = {};
 const chatIo = io//.of('/chat')

 chatIo.on('connection',(socket)=>{

  console.log('chat io connected');

  socket.on('join', (data) => {  
    socket.join(data.room);
    console.log(data.room,'room')        
    chatRooms.find({}).exec((err, rooms) => {
        if(err){
            console.log(err);
            return false;
        }
        count = 0;
        rooms.forEach((room) => {
          console.log(room.name,'jjjj',data.room)
            if(room.name == data.room){
              
                count++;
                console.log(count,'count')
            }
        });
        // Create the chatRoom if not already created
        if(count == 0) {
          console.log('inserting chat room')
          const cr = new chatRooms({
            name:data.room
          })
          cr.save()
            // chatRooms.create({ name: data.room, messages: [] }); 
        }
    });
});

socket.on('message', (data) => {
  console.log('new meaage............/////','',data)
  // emitting the 'new message' event to the clients in that room
 
  io.to(data.room).emit('new message', {user: data.user,userName:data.userName ,message:{msg:data.message,contentType:'text',date:Date.now()}});
  // save the message in the 'messages' array of that chat-room
  chatRooms.updateOne({name: data.room}, { $push: { messages: { user: data.user, message:{msg:data.message,contentType:'text' }} } }, (err, res) => {
      if(err) {
          console.log(err);
          return false;
      }
      
  });
});

socket.on('audio',(data)=>{
  const buffer = data.message
  io.to(data.room).emit('new message', {user: data.user,userName: data.userName, message:{msg:buffer,contentType:'audio',date:Date.now()}});
  // save the message in the 'messages' array of that chat-room
  chatRooms.updateOne({name: data.room}, { $push: { messages: { user: data.user, message:{msg:buffer,contentType:'audio' }} } }, (err, res) => {
      if(err) {
          console.log(err);
          return false;
      }
      
  });
})

socket.on('typing', (data) => {
  // Broadcasting to all the users except the one typing 
  socket.broadcast.in(data.room).emit('typing', {data: data, isTyping: true});
});

  socket.on('join-video',(roomId,userId,reciever)=>{
    //notification 
    console.log(reciever,'reciever')

    io.to(reciever).emit('video-calling',{roomId,reciever})

    console.log(roomId,'video room',userId,'userId')
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-video-connected',userId)

    socket.on('disconnect',()=>{
      socket.broadcast.to(roomId).emit('user-disconnected',userId)
    })
  })
  socket.on('user-initial-connection',(userId)=>{
    socket.join(userId)
  })

  

 
  socket.on("Start", function (data) {
    console.log("Start Upload");
  
    const { Name, Size } = data;
  
    Files[Name] = {
      FileSize: Size,
      Data: [],
      Downloaded: 0,
      Handler: null,
    };
  
    try {
      const stat = fs.statSync(`Temp/${Name}`);
      if (stat.isFile()) {
        Files[Name].Downloaded = stat.size;
      }
    } catch (err) {
      // It's a new file, so nothing to do
    }
  
    fs.open(`public/Temp/${Name}`, "a", 0o755, function (err, fd) {
      if (err) throw err;
  
      Files[Name].Handler = fd;
  
      socket.emit("MoreData", {
        Place: Files[Name].Downloaded / chunkSize,
        Percent: (Files[Name].Downloaded / Files[Name].FileSize) * 100,
      });
    });
  });
  
  socket.on("Upload", async function (data) {
    console.log("Uploading");
  
    const { Name, Data } = data;
  
    Files[Name].Downloaded += Data.length;
    Files[Name].Data.push(Data);
  
    if (Files[Name].Downloaded === Files[Name].FileSize) {
      console.log("Fully uploaded");
  try {
   
    const fileBuffer = Buffer.concat(Files[Name].Data);
    console.log(typeof fileBuffer,'type of filebuffer')
      // await pipelineAsync(
      //   fileBuffer,
      //   fs.createWriteStream(`Temp/${Name}`),
      // );
  
      // await pipelineAsync(
      //   fs.createReadStream(`Temp/${Name}`),
      //   fs.createWriteStream(`Video/${Name}`),
      // );
  
      // fs.unlink(`Temp/${Name}`, function () {
      //   //This Deletes The Temporary File
      //   //Moving File Completed
      // });
  
      // exec(
      //   `ffmpeg -i Video/${Name} -ss 00:01 -r 1 -an -vframes 1 -f mjpeg Video/${Name}.jpg`,
      //   function (err) {
      //     if (err) throw err;
  
      //     socket.emit("UploadComplete", {
      //       Image: `Video/${Name}.jpg`,
      //     });
      //   }
      // );
  } catch (error) {
    console.log(error,'erorororrorororor')
  }
      
    } else if (Files[Name].Data.length >= 5) {
      console.log("Chunk size reached");
  
      const fileBuffer = Buffer.concat(Files[Name].Data);
      Files[Name].Data = [];
  
      await promisify(fs.write)(
        Files[Name].Handler,
        fileBuffer,
        null,
        "Binary"
      );
  
      const place = Files[Name].Downloaded / chunkSize;
      const percent = (Files[Name].Downloaded / Files[Name].FileSize) * 100;
  
      socket.emit("MoreData", {
        Place: place,
        Percent: percent,
      });
    } else {
      const place = Files[Name].Downloaded / chunkSize;
      const percent = (Files[Name].Downloaded / Files[Name].FileSize) * 100;
  
      socket.emit("MoreData", {
        Place: place,
        Percent: percent,
      });
    }
  });












//   socket.on("Start", function (data) {
//     console.log('start.............................');
//     //data contains the variables that we passed through in the html file 
//     const Name = data["Name"];
//     Files[Name] = {
//       //Create a new Entry in The Files Variable 
//       FileSize: data["Size"],
//       Data: "",
//       Downloaded: 0,
//     };
//     let Place = 0;
//     try {
//       const Stat = fs.statSync("Temp/" + Name);
//       if (Stat.isFile()) {
//         Files[Name]["Downloaded"] = Stat.size;
//         Place = Stat.size / 524288;
//       }
//     } catch (er) {} //It's a New File 
//     fs.open("Temp/" + Name, "a", 0755, function (err, fd) {
//       if (err) {
//         console.log(err);
//       } else {
//         Files[Name]["Handler"] = fd; //We store the file handler so we can write to it later 
//         socket.emit("MoreData", { Place: Place, Percent: 0 });
//       }
//     });
//   });

//   socket.on("Upload", function (data) {
//     console.log('uploadiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiing');
//     var Name = data["Name"];
//     Files[Name]["Downloaded"] += data["Data"].length;
//     Files[Name]["Data"] += data["Data"];
//     if (Files[Name]["Downloaded"] == Files[Name]["FileSize"]) {
//       //If File is Fully Uploaded 
//       fs.write(
//         Files[Name]["Handler"],
//         Files[Name]["Data"],
//         null,
//         "Binary",
//         function (err, Writen) {
//           //Get Thumbnail Here 
//           let inp = fs.createReadStream("Temp/" + Name);
// let out = fs.createWriteStream("Video/" + Name);
// util.pump(inp, out, function () {
//     fs.unlink("Temp/" + Name, function () {
//         //This Deletes The Temporary File 
//         //Moving File Completed 
//     });
// });
// exec(
//   "ffmpeg -i Video/" +
//     Name +
//     " -ss 01:30 -r 1 -an -vframes 1 -f mjpeg Video/" +
//     Name +
//     ".jpg",
//   function (err) {
//     socket.emit("Done", { Image: "Video/" + Name + ".jpg" });
// })
//         }
//       );
//     } else if (Files[Name]["Data"].length > 10485760) {
//       //If the Data Buffer reaches 10MB 
//       fs.write(
//         Files[Name]["Handler"],
//         Files[Name]["Data"],
//         null,
//         "Binary",
//         function (err, Writen) {
//           Files[Name]["Data"] = ""; //Reset The Buffer 
//           let Place = Files[Name]["Downloaded"] / 524288;
//           let Percent =
//             (Files[Name]["Downloaded"] / Files[Name]["FileSize"]) * 100;
//           socket.emit("MoreData", { Place: Place, Percent: Percent });
//         }
//       );
//     } else {
//       let Place = Files[Name]["Downloaded"] / 524288;
//       let Percent = (Files[Name]["Downloaded"] / Files[Name]["FileSize"]) * 100;
//       socket.emit("MoreData", { Place: Place, Percent: Percent });
//     }
//   });

 })

// io.on('connection',(socket)=>{
//   console.log('New client connected');

// })


instrument(io,{auth:false})

}catch(e){
    console.log(e,'error');
}




