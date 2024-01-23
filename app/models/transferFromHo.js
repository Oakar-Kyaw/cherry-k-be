"use strict"

const mongoose = require("mongoose")
mongoose.promise = global.Promise
const Schema  = mongoose.Schema

const TransferFromHoschema = new Schema({
    isDeleted: {
        type: Boolean,
        default: false
    },
    transferAmount: {
        type: Number
    },
    closingAmount: {
        type: Number
    },
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AccountingLists"
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AccountingLists"
    },
    remark: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    transferDate: {
        type: Date,
    }
})

module.exports = mongoose.model("TransferFromHos",TransferFromHoschema)