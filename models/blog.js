const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: true,
        min: 3,
        max: 160
    },
    slug: {
        type: String,
        unique: true,
        index: true
    },
    body: {
        type: {},
        required: true,
        min: 200,
        max: 2000000
    },
    excerpt: {
        type: String,
        max: 1000
    },
    mtitle: {
        type: String
    },
    mdesc: {
        type: String
    },
    photo: {
        type: String,
        default: null
    },
    categories: [
        {
            type: ObjectId,
            ref: 'Category',
            required: true
        }
    ],
    tags: [
        {
            type: ObjectId,
            ref: 'Tag',
            required: true
        }
    ],
    postedBy: {
        type: ObjectId,
        ref: 'User'
    }
}, { timestamps: true })

module.exports = mongoose.model("Blog", blogSchema)