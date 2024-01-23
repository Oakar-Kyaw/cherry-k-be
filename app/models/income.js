'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;


let IncomeSchema = new Schema({
    code: {
        type: String,
    },
    seq: {
        type: Number
    },
    relatedAccounting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccountingLists',
        required: true
    },
    date: {
        type: Date,
    },
    remark: {
        type: String,
    },
    initialAmount: {
        type: Number,
    },
    initialCurrency: {
        type: String,
    },
    finalAmount: {
        type: Number,
    },
    finalCurrency: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    },
    relatedBankAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccountingLists'
    },
    relatedCashAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccountingLists'
    },
    relatedCredit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccountingLists'
    },
    relatedBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branches'
    },
});

module.exports = mongoose.model('Incomes', IncomeSchema);

//Author: Kyaw Zaw Lwin
