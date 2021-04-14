const express = require('express')
const router = express.Router()
const multer = require('multer')

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/upload')
    },
    filename: (req, file, cb) => {
        let filetype = ''
        if (file.mimetype === 'image/gif') {
            filetype = 'gif'
        }
        if (file.mimetype === 'image/png') {
            filetype = 'png'
        }
        if (file.mimetype === 'image/jpeg') {
            filetype = 'jpg'
        }
        cb(null, 'image-' + Date.now() + '.' + filetype)
    }
})

let upload = multer({ storage: storage })

const { requireSignin, authMiddleware, adminMiddleware } = require('../controllers/auth')
const { read, publicProfile, update, photo } = require('../controllers/user')

router.get('/user/profile', requireSignin, authMiddleware, read)
router.get('/user/:username', publicProfile)
router.put('/user/update', requireSignin, authMiddleware, update)
router.get('/user/photo/:username', photo)

module.exports = router