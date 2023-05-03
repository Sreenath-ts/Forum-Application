const User = require('../model/user-model')
const Question = require('../model/question-model')
const Answer = require('../model/answer-model')
const Comment = require('../model/comment-model')
const Filter = require('bad-words');
const filter = new Filter();
const natural = require('natural');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports={
    question:async(req,res)=>{
        let user = req.user._id
        user = ObjectId(user)
        const titleHtml = req.body.titleHtml
        const title = req.body.title
       let body = req.body.body
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
    </div>`);
    
        if (filter.isProfane(title)) {
            
            return res.status(200).json({ err: `Don't use faul langauge!` })
        }else{
           const question = await Question.create({
            title,
            titleHtml,
            body,
            user
           })
         return  res.status(200).json({status:true})
        } 
       },
       similarQ:async(req,res)=>{
        const q = req.body.title
        const tokenizer = new natural.WordTokenizer();
        const userQuestionTokens = tokenizer.tokenize(q.toLowerCase());
        const dbQuestions = await Question.find().select({titleHtml:1,body:1,user:1,title:1,_id:1});
        const options = { ignoreCase: true };
        const similarityThreshold = 0.5; 
        const similarityScores = [];
        const tokenizer1 = new natural.WordTokenizer();
        dbQuestions.forEach((dbQuestion)=>{
            console.log(dbQuestion,'pooiii single question')
            const dbQuestionTokens = tokenizer1.tokenize(dbQuestion.title.toLowerCase());
            const jaccardIndex = natural.JaroWinklerDistance(userQuestionTokens.join(' '), dbQuestionTokens.join(' '),options);
            if (jaccardIndex >= similarityThreshold) {
                      similarityScores.push({ question: dbQuestion, score: jaccardIndex });
                   }
        })
        similarityScores.sort((a, b) => b.score - a.score);
        console.log(similarityScores,'simScore')
        if(similarityScores.length>=0){
            res.status(200).json({
        data: similarityScores
    })
        }else{
            return res.status(200).json({
                data:[]
            })
        }
       },
}