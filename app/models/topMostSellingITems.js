'use strict';

const mongoose = require('mongoose')
mongoose.promise = global.Promise
const Schema = mongoose.Schema

let TopMostSellingItemsSchema = new Schema({
    accessoryItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccessoryItems'
    },
    medicineItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicineItems'
    },
    procedureItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProcedureItems'
    },
    generalItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GeneralItems'
    },
    quantity: {
        type: Number,
        default:0
    },
    date: {
       type: Date
    },
    total_amount:{
        type: Number,
        default: 0
    },
    relatedBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branches'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
});

module.exports = mongoose.model('TopMostSellingItems', TopMostSellingItemsSchema);

//Author: Oakar Kyaw
