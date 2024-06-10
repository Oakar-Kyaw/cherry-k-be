"use strict"

const mongoose = require("mongoose")
mongoose.Promise = global.Promise
const Schema = mongoose.Schema

const promotionPageSchema = new Schema({
    isDeleted: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        required: true
    },
    sub_title: {
        type: String
    },
    image: {
        type: String
    },
    description: {
        type: String
    }
})

module.exports = mongoose.model("PromotionPages", promotionPageSchema)

