const express = require('express')
const router = express.Router()
const {v4:uuidV4} = require('uuid')



const {signup,login,protect,
logout,
tokenVerify,
recaptcha,
verifyEmail,
OtpCheck,
checkUser
} = require('../controllers/auth-controller')
const  {question,similarQ} = require('../controllers/question-controller')
const {getUsers,profileEdit,
    Home,
    activeQuestion,
    questionAnswer,
    commentAdd,
    questionVote,
    answerVote,
    questionReport,
    runCode,
    coPilot
} = require('../controllers/user-controller')

const { getChatRoom,
    chatRooms} = require('../controllers/chat-controller')

const {videoFetch} = require('../controllers/video-controller')



router.post('/signup',recaptcha,signup)

router.post('/login',recaptcha, login)

router.get('/allUsers',protect,getUsers)

router.get('/logout',logout)

router.put('/profileEdit',protect,profileEdit)

router.get('/refresh-token',tokenVerify)

router.get('/verify-email',protect,verifyEmail)

router.post('/otp-check',protect,OtpCheck)

router.post('/question',protect,question)

router.post('/similar-question',protect,similarQ)

router.get('/home',Home)

router.get('/active-question/:id',checkUser,activeQuestion)

router.post('/active-question/answer',protect,questionAnswer)

router.post('/commentAdd',protect,commentAdd)

router.patch('/vote',protect,questionVote)

router.patch('/answerVote',protect,answerVote)

router.patch('/report-question',protect,questionReport)

router.get('/chatroom/:room',protect,getChatRoom)

router.get('/chatrooms',protect,chatRooms)

router.post('/run-code',protect,runCode)

router.post('/co-pilot',coPilot)





router.get('/video-fetch',videoFetch)

router.get('/room',protect,(req,res)=>{
//send the roomId here

res.status(200).json({data:uuidV4()})
})



module.exports=router