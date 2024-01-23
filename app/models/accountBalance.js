'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;
const validator = require('validator');


let AccountBalance = new Schema({
    createdAt: {
        type:Date,
        default: Date.now
    },
    relatedAccounting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccountingLists'
    },
    type: {
        type: String,
        enum: ['Opening', 'Closing']
    },
    amount: {
        type: Number,
    },
    date: {
        type: Date,
    },
    remark: {
        type: String,
    },
    relatedBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branches'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    transferAmount: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('AccountBalances', AccountBalance);

//Author: Kyaw Zaw Lwin
