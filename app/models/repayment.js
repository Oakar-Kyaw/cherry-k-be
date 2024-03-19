'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;


let RepaymentSchema = new Schema({
  repaymentDate: {
    type: Date,
  },
  repaymentAmount: {
    type: Number,
  },
  remaningCredit: {
    type: Number,
  },
  description: {
    type: String,
  },
  relatedDebt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Debts"
  },
  relatedTreatmentVoucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TreatmentVouchers"
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  relatedBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountingLists'
  },
  relatedCash: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountingLists'
  },
  relatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branches'
  },
  relatedPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patients"
  },
  expireAt: {
    type: Date,
    index: {
      expireAfterSeconds: 1
    }
  }
});

module.exports = mongoose.model('Repayments', RepaymentSchema);

//Author: Kyaw Zaw Lwin
