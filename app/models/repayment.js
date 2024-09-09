"use strict";

const mongoose = require("mongoose");
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
    ref: "Debts",
  },
  relatedTreatmentVoucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TreatmentVouchers",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  relatedBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccountingLists",
  },
  relatedCash: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccountingLists",
  },
  relatedBankAmount: {
    type: Number,
    default: 0,
  },
  relatedCashAmount: {
    type: Number,
    default: 0,
  },
  relatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branches",
  },
  branchWithPrefix: {
    type: String,
    default: function () {
      return this.relatedBranch
        ? `KVC - ${this.relatedBranch.toString()}`
        : "KVC - DefaultCode";
    },
  },
  relatedPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patients",
  },
  expireAt: {
    type: Date,
    index: {
      expireAfterSeconds: 1,
    },
  },
});

// // Create virtual field to prepand to KVC voucher code
// RepaymentSchema.virtual("relatedBranchCode").get(function () {
//   return this.relatedBranch ? `KVC - ${this.relatedBranch}` : null;
// });

module.exports = mongoose.model("Repayments", RepaymentSchema);

//Author: Kyaw Zaw Lwin
