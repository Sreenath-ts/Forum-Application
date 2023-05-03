const User = require('../model/user-model')
const Question = require('../model/question-model')
const Answer = require('../model/answer-model')
const Comment = require('../model/comment-model')
const Filter = require('bad-words');
const filter = new Filter();
const natural = require('natural');
const ObjectId = require('mongoose').Types.ObjectId;
const https = require('https');
module.exports={
   getUsers:async(req,res)=>{
    const userId = req.user._id
    try{
        const users = await User.find({_id:{$ne:userId}}).select({name:1,email:1})
        res.status(200).json({
            status:'success',
            data:users
        })
    }catch (e){

    }
   } ,
   profileEdit:async(req,res)=>{
    const id = req.query.id
    let image = req.file.path
    image = image.substring(6)
    image = `http://localhost:3000/${image}`
    console.log(image,id,'image came');
    const upUser = await User.findByIdAndUpdate(id,{$set:{photo:image}},{new:true})
    res.status(200).json({
        status:'success',
        data:{
            upUser
        }
    })
   },


  
   Home:async(req,res)=>{
    
    const offset = req.query.offset
    let limit = await Question.countDocuments()
    console.log(limit,'limit');
    let dbQuestions;
    if(limit>=5){
     dbQuestions = await Question.find().populate('user').select({titleHtml:1,body:1,user:1,title:1}).skip(offset).limit(5);
     limit -= 5
    }else{
      dbQuestions = await Question.find().populate('user').select({titleHtml:1,body:1,user:1,title:1}).skip(offset).limit(limit);
    }
    console.log(dbQuestions,'home q',limit)
    res.status(200).json({
        data: dbQuestions
    })
   },
   
   activeQuestion:async(req,res)=>{

    const user = req.user




    const id = req.params.id
   let answers;
let userReaction = '';
   let activeQuestion = await Question.findById(id).select({titleHtml:1,body:1,user:1,title:1,reactions:1,upVotes:1,downVotes:1})
   if(user){
    const userId = user._id
   activeQuestion.upVotes.forEach((el)=>{
      if( el.user.toString() == userId.toString()){
        userReaction  = 'liked' 
      }
   
    })
   activeQuestion.downVotes.forEach((el)=>{
        console.log(el.user,'user',userId);
     if(el.user.toString() == userId.toString()) {
       
        userReaction = 'disliked' 
     } 
    })
    //  answers = await Answer.aggregate([{$match:{$or:[{'upVotes.user':userId},{'downVotes.user':userId}]}},
      
    //  {$set:{answer:{
    //     $map:{
    //         input:"$answer",
    //         as:'ans',
    //         in:{
    //            $mergeObjects:[
    //             "$$ans"
    //            ,
    //         {
    //             userReaction:{
    //                 $cond:{
    //                     if:{$in:[userId,"$upVotes.user"]},
    //                     then:"liked",
    //                     else:{
    //                         $cond:{
    //                             if:{$in:[userId,'$downVotes.user']},
    //                             then:"disliked",
    //                             else:''
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //         ] 
    //         }
    //     }
    //  }}}

    // ])
       console.log(id,'question')
     answers = await Answer.aggregate([{$match:{question:ObjectId(id)}},
        {$lookup:{
            from:'users',
            localField:'answer.user',
            foreignField:'_id',
            as:'userDetials'
        }},{
            $unwind:'$userDetials'
        },
        {
        $set: {
          answer: {
            $map: {
              input: "$answer",
              as: "ans",
              in: {
                $mergeObjects: [
                  "$$ans",
                  {
                    userReaction: {
                      $cond: {
                        if: {
                          $or: [ {$and:[ { $in: [userId, "$upVotes.user"] },{$in:['$$ans._id',"$upVotes.answer"]}]
                           },
                           {$and:[{ $in: [userId, "$downVotes.user"] },{$in:['$$ans._id',"$downVotes.answer"]}]
                            },
                          ],
                        },
                        then: {
                          $cond: {
                            // if: { $in: [userId, "$upVotes.user"] },
                            if:{$and:[ { $in: [userId, "$upVotes.user"] },{$in:['$$ans._id',"$upVotes.answer"]}]
                          },
                            then: "liked",
                            else: "disliked",
                          },
                        },
                        else: "",
                      },
                    },
                    user:"$userDetials"
                  },
                ],
              },
            },
          },
        },
      },{$project:{userDetials:0}}])

   }else{
    console.log('use else..>>>>>>>>>')
      answers = await Answer.findOne({question:id}).populate('answer.user')
   }

   let Allcomment;
   if(answers | answers.length>0){
    
    const ansAry = Array.isArray(answers) ? answers[0].answer : answers.answer 
    // Allcomment = await Comment.findOne({answer:answers._id},{answer:0})
     console.log(ansAry,'ansAry........')
    // Allcomment = await Comment.find({answer:{$in:ansAry.map(obj=> obj._id)}})
    Allcomment = await Comment.aggregate([{
        $match:{answer:{$in:ansAry.map(obj=> obj._id)}},  
    },{$unwind:"$comments"},{$addFields:{'comments.answer':"$answer"}},{$project:{comments:1,_id:0}}])
   Allcomment = Allcomment.map(el=>{
   
    return el.comments
   })
   }
   activeQuestion.upVotes = undefined
   activeQuestion.downVotes = undefined
   activeQuestion = JSON.parse(JSON.stringify(activeQuestion))
   activeQuestion.userReaction = userReaction
   console.log(activeQuestion,'active action',answers);
   res.status(200).json({
    data: activeQuestion,
    answer:answers | answers.length>0 ?  Array.isArray(answers)? answers[0].answer :answers.answer : [],
    comments:Allcomment && Allcomment.length>0 ? Allcomment : []
})
   },
   questionAnswer:async(req,res)=>{
    let { body , qId} = req.body;
    const uId = req.user._id
    let searchTextRegex =/(<pre\b[^>]*>)([\s\S]*?)(<\/pre>)/gi;
    body = body.replace(searchTextRegex,`<div class=" bg-gray-800 rounded-lg overflow-hidden mt-6">
    <div class="flex justify-between">
        <div id="header-buttons" class="py-3 px-4 flex">
            <div class="rounded-full w-3 h-3 bg-red-500 mr-2"></div>
            <div class="rounded-full w-3 h-3 bg-yellow-500 mr-2"></div>
            <div class="rounded-full w-3 h-3 bg-green-500"></div>
        </div>
        <button  class="p-2 text-center bg-gray-800 text-gray-100 hover:bg-gray-700 rounded flex justify-between items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" class="pr-1">
                <path fill="currentColor" fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v9a2 2 0 002 2h2v2a2 2 0 002 2h9a2 2 0 002-2V8a2 2 0 00-2-2h-2V4a2 2 0 00-2-2H4zm9 4V4H4v9h2V8a2 2 0 012-2h5zM8 8h9v9H8V8z"/>
            </svg>
            Copy
        </button>
    </div>
    <div class="w-full mx-2 my-2 overflow-auto">
    $1$2$3
    </div>
</div>`)
    const SingleAnswer = {
        body,
        date:Date.now(),
        user:uId
      };
      let answer = await Answer.findOne({question:qId})
      if(!answer){
      answer =  await Answer.create({question:qId})
      }
     const length = answer.addAnswer(SingleAnswer)
      answer.save((err,doc) => {
        if (err) {
          return res.status(500).json(err);
        }
    const  Fanswer =  doc.answer[length - 1]
       const io = req.app.get('io')
       io.emit('answer', Fanswer);
        return res.json(Fanswer);
      });
   },
   commentAdd:async(req,res)=>{
  try {
    const user = req.user._id
    const ansId = req.body.ansId
    const {body} = req.body
    const Scomment = {
        body,
        date:Date.now(),
        user
    }
     let comments = await Comment.findOneAndUpdate({answer:ansId},{ $push: { comments: Scomment } },{new:true,upsert:true})
    let length = comments.comments.length
  const newC =  JSON.parse(JSON.stringify(comments.comments[length - 1]))
  newC.answer = comments.answer
  console.log(newC);
    const io = req.app.get('io')
    io.emit('comment', newC);
     return res.json( newC);
  } catch (error) {
    console.log(error);
     res.status(500).json(error);
  }
   
   },
   questionVote:async(req,res)=>{
    try{
        console.log('checking ..............###############..........$$$$$$$$$$$$$$',req.body);
    const {count,qId}= req.body
    const uId = req.user._id
    let upQ;
    const alreadyUp = await Question.findOne({$and:[{_id:qId,'upVotes.user':uId}]})
    const alreadyDown = await Question.findOne({$and:[{_id:qId,'downVotes.user':uId}]})
    console.log(alreadyDown,'downnnnnnnnnnnnnnnnnnnnnn',alreadyUp,'upppppppppppppppppppppppppppppppp');
    let liked = 0
    let disliked = 0;
    let status;
    if(count == 1){
      if(alreadyDown){
       liked++;
       status ='liked'
       console.log('first if');
        await Question.findOneAndUpdate({_id:qId},{$pull:{downVotes:{user:uId}},$inc:{reactions:1}})
      }
       if(!alreadyUp){
        liked++;
        status ='liked'
        console.log('2nd if');
        upQ = await Question.findOneAndUpdate({_id:qId},{$addToSet:{upVotes:{user:uId}},$inc:{reactions:1}})
       }
        else{
            disliked++;
            status ='disliked'
            console.log('3rd if');
            upQ = await Question.findOneAndUpdate({_id:qId},{$pull:{upVotes:{user:uId}},$inc:{reactions:-1}})
        }
         return res.status(200).json({
            status,
            liked,
            disliked:(disliked * -1)
         })
    } 
       
        if(alreadyUp){
             disliked++;
             status ='disliked'
             console.log('4th if');
            upQ = await Question.findOneAndUpdate({_id:qId},{$pull:{upVotes:{user:uId}},$inc:{reactions:-1}})
        }
        if(!alreadyDown){
            disliked++;
            status ='disliked'
            console.log('5th if');
            upQ = await Question.findOneAndUpdate({_id:qId},{$addToSet:{downVotes:{user:uId}},$inc:{reactions:-1}})
        }else{
            liked++;
            status ='liked'
            console.log('6th if');
           await Question.findOneAndUpdate({_id:qId},{$pull:{downVotes:{user:uId}},$inc:{reactions:1}})
        }
    
   return res.status(200).json({
    status,
    liked,
    disliked:(disliked * -1)
 })

    }catch(e){
        console.log(e);
        if (e.code = 11000) {
            res.status(400).json({
                status: 'failed',
                err: 'This email already exists.'
            })
            return
        }
    }
   },
   answerVote:async(req,res)=>{
    try{
        const {count,ansId,qId}= req.body
        const uId = req.user._id
        let upAns;
        const alreadyUp = await Answer.findOne({$and:[{question:qId,'upVotes.answer':ansId,'upVotes.user':uId}]})
        const alreadyDown = await Answer.findOne({$and:[{question:qId,'downVotes.answer':ansId,'downVotes.user':uId}]})
        console.log(alreadyDown,'downnnnnnnnnnnnnnnnnnnnnn',alreadyUp,'upppppppppppppppppppppppppppppppp');
        let liked = 0
        let disliked = 0;
        let status;
        if(count == 1){
            if(alreadyDown){
             liked++;
             status ='liked'
             console.log('first if');
              await Answer.findOneAndUpdate({question:qId,'downVotes.answer':ansId,'answer._id':ansId},{$pull:{downVotes:{$and:[{user:uId,answer:ansId}]}},$inc:{'answer.$.reactions':1}})
            }
             if(!alreadyUp){
              liked++;
              status ='liked'
              console.log('2nd if');
              upQ = await Answer.findOneAndUpdate({$and:[{question:qId,'answer._id':ansId}]},{$addToSet:{upVotes:{user:uId,answer:ansId}},$inc:{'answer.$.reactions':1}})
             }
              else{
                  disliked++;
                  status ='neutralised'
                  console.log('3rd if',ansId,'ans',uId);
                  upQ = await Answer.findOneAndUpdate({question:qId,'upVotes.answer':ansId,'answer._id':ansId},{$pull:{upVotes:{user:uId,answer:ansId}},$inc:{'answer.$.reactions':-1}},{new:true})
                  console.log(upQ,'updated q???????????????????????????????????????');
              }
               return res.status(200).json({
                  status,
                  liked,
                  disliked:(disliked * -1)
               })
          }
          
          if(alreadyUp){
            disliked++;
            status ='disliked'
            console.log('4th if');
           upQ = await Answer.findOneAndUpdate({question:qId,'upVotes.answer':ansId,'asnwer._id':ansId},{$pull:{upVotes:{$and:[{user:uId,answer:ansId}]}},$inc:{'answer.$.reactions':-1}})
       }
       if(!alreadyDown){
           disliked++;
           status ='disliked'
           console.log('5th if');
           upQ = await Answer.findOneAndUpdate({$and:[{question:qId,'answer._id':ansId}]},{$addToSet:{downVotes:{user:uId,answer:ansId}},$inc:{'answer.$.reactions':-1}})
       }else{
           liked++;
           status ='neutralised'
           console.log('6th if');
          await Answer.findOneAndUpdate({question:qId,'downVotes.answer':ansId,'asnwer._id':ansId},{$pull:{downVotes:{$and:[{user:uId,answer:ansId}]}},$inc:{'answer.$.reactions':1}})
       }
  return res.status(200).json({
   status,
   liked,
   disliked:(disliked * -1)
})
    }catch(e){
        console.log(e)
    }
   },
  questionReport:async(req,res)=>{
   try{
    console.log('reorting .................. question @@@@')
    const {reason,qId} = req.body
    const user = req.user._id
    // const alreadyExist = await Question.findOne({_id:qId,'report.user':user})
    // if(alreadyExist){
    //   return  res.status(400).json({
    //     status: 'failed',
    //     err: 'You once reported this content.'
    // })
    // }
    await Question.findOneAndUpdate({_id:qId},{$addToSet:{report:{user,reason}}})
    return res.status(200).json({
      status:true
    })
   }catch(e){
    console.log(e)
    return  res.status(400).json({
      status: 'failed',
      err: 'Internal Server Error'
  })
   }
  
  } ,
  runCode:async(req,res)=>{
    const {language,script} = req.body
    var request = require('request');
console.log(req.body,'here')
  
    var program = {
      script : script,
      language: language,
      versionIndex: "0",
      clientId: "9ef4e00c6c906c65b8446b3fc667d69b",
      clientSecret:"48bc7344882415d03605c5b05e22f7370c6abf08680086cfa2b25949dc501dea"
  };
  request({
      url: 'https://api.jdoodle.com/v1/execute',
      headers: {
          'Content-Type': 'application/json'
        },
      method: "POST",
      json: program
  },
  function (error, response, body) {
      console.log('error:', error);
      console.log('statusCode:', response && response.statusCode);
      console.log('body:', body);
      res.status(200).json({data:body})
  })
  },
  coPilot : async(req,res)=>{
    
    
const keywords = req.body.keywords
const API_BASE_URL = '/2.3';
const SEARCH_ENDPOINT = '/search';
const QUESTIONS_ENDPOINT = '/questions';
const ANSWERS_ENDPOINT = '/answers';
const API_KEY = 'W1kgnI2XQQxShBRgApwW4Q((';

const searchStackOverflow = async (keywords) => {
    const searchUrl = `${API_BASE_URL}${SEARCH_ENDPOINT}?order=desc&sort=votes&intitle=${encodeURIComponent(keywords)}&site=stackoverflow&key=${API_KEY}`;
    // &filter=total,question_id,is_answered`;

  const questionsResponse = await makeApiCall(searchUrl);
  console.log(questionsResponse,'hereeeee')
  const questionIds = questionsResponse.map((item) => item.question_id);
  console.log(questionIds,'ids');
  const answersUrl = `${API_BASE_URL}${QUESTIONS_ENDPOINT}/${questionIds.join(';')}${ANSWERS_ENDPOINT}?order=desc&sort=votes&site=stackoverflow&key=${API_KEY}&filter=withbody`;

  const answersResponse = await makeApiCall(answersUrl);
   var res=[];
  const codeSnippets = answersResponse
    .filter((item) => item.is_accepted )
    .map((item,i) =>{
        console.log(item,'all item')
        console.log(item.body,'body');
        res.push(item.body)
  //  res =  extractCodeSnippets(item.body)
  });
console.log(res,'result');
  return res;
};

const makeApiCall = async (url) => {

const options = {
  hostname: 'api.stackexchange.com',
  path: url,
  headers: {
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'application/json',
    'Accept-Charset': 'utf-8'
  }
}

  return new Promise((resolve, reject) => {
    https.get(options, (res) => {
        let data = '';
              const encoding = res.headers['content-encoding'];

              if (encoding === 'gzip') {
                const gunzip = require('zlib').createGunzip();
                res.pipe(gunzip);
                gunzip.on('data', (chunk) => {
                  data += chunk.toString();
                });
                gunzip.on('end', () => {
                  try {
                    const result = JSON.parse(data);
                    console.log(data,'datataatatatatatatatatatattatatat')
                    resolve(result.items);
                  } catch (error) {
                    reject(error);
                  }
                });
              } else {
                res.on('data', (chunk) => {
                  data += chunk.toString();
                });
                res.on('end', () => {
                  try {
                    const result = JSON.parse(data);

                    resolve(result.items);
                  } catch (error) {
                    reject(error);
                  }
                });
              }
        
              res.on('error', (error) => {
                console.error(error);
                reject(error);
              });
    });
  });
};

const extractCodeSnippets = (html) => {
    const codeTagsRegex = /<code>[\s\S]*?<\/code>/gs;
    const codeBlocks = html.match(codeTagsRegex) || [];
    const codeSnippets = [];
  
    for (const codeBlock of codeBlocks) {
      const codeSnippet = codeBlock
        .replace(/<[^>]*>/g, '') // remove HTML tags
        .replace(/&lt;/g, '<') // unescape HTML entities
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
  
      if (codeSnippet) {
        codeSnippets.push(codeSnippet);
      }
    }
  console.log(codeSnippets,'hi');
    return codeSnippets;
  };
  
  
  

// Example usage:
searchStackOverflow(keywords)
  .then((codeSnippets) => {
    console.log('Code snippets:', codeSnippets.length);
    let ress = []
    ress.push(codeSnippets[0])
    res.status(200).json(ress)
  })
  .catch((error) => {
    console.error('Search error:', error);
  });

  }
}