"use strict"

const mongoose = require("mongoose")
mongoose.promise = global.Promise
const Schema = mongoose.Schema

const TransferToHoRequestSchema = new Schema({
    isDeleted:{
        type: Boolean,
        default: false
    },
    relatedBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branches"
    },
    procedureItems: [{
        item_id: {
           type: mongoose.Schema.Types.ObjectId,
           ref: 'ProcedureItems' 
        },
        qty: {
            type: Number,
        } 
    }],
    accessoryItems: [{
        item_id: {
             type: mongoose.Schema.Types.ObjectId,
             ref: 'AccessoryItems'
        },
        qty: {
            type: Number,
        }  
    }],
    medicineItems: [{
        item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MedicineItems'
        },
        qty: {
            type: Number,
        }   
    }],
    generalItems: [{
        item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GeneralItems'
        },
        qty: {
            type: Number,
        }   
    }],
    reason: {
        type: String
    },
    date: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expireAt: {
        type: Date,
        index: {expireAfter: 60 * 24 *31 }  // expires After 1 month
      },
})

module.exports = mongoose.model("TransferToHoRequests",TransferToHoRequestSchema)