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

const { create, list, listAllBlogsCategoriesTags, read, remove, update, photo, listRelated, listSearch, listByUser } = require('../controllers/blog')
const { requireSignin, adminMiddleware, authMiddleware, canUpdateDeleteBlog } = require('../controllers/auth')

router.post('/blog', upload.single('photo'), requireSignin, adminMiddleware, create)
router.get('/blogs', list)
router.post('/blogs-categories-tags', listAllBlogsCategoriesTags)
router.get('/blog/:slug', read)
router.delete('/blog/:slug', requireSignin, adminMiddleware, remove)
router.put('/blog/:slug', upload.single('photo'), requireSignin, adminMiddleware, update)
router.get('/blog/photo/:slug', photo)
router.post('/blogs/related', listRelated)
router.get('/blogs/search', listSearch)

// auth user blog crud
router.post('/user/blog', upload.single('photo'), requireSignin, authMiddleware, create)
router.get('/:username/blogs', listByUser)
router.delete('/user/blog/:slug', requireSignin, authMiddleware, canUpdateDeleteBlog, remove)
router.put('/user/blog/:slug', upload.single('photo'), requireSignin, authMiddleware, canUpdateDeleteBlog, update)

module.exports = router