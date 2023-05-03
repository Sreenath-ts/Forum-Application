const express = require('express')
const router = express.Router()

const {login,allUsers,blockUser,search,editUser} = require('../controllers/admin-controller')
const {protect} = require('../controllers/auth-controller')
const {addTags} = require('../controllers/tag-controller')
router.post('/login',login)

router.get('/allUsers',protect,allUsers)

router.get('/blockUser',blockUser)

router.get('/user',search)

router.post('/editUser',editUser)

router.post('/add-tag',protect,addTags)

module.exports = router