"use strict";

const mongoose = require("mongoose");
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;

let RefundPackageSchema = new Schema({
  voucherCode: {
    type: String,
  },
  relatedTreatmentVoucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TreatmentVouchers",
    require: true,
  },
  refundDate: {
    type: Date,
    default: Date.now,
  },
  replaceTreatmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Treatments",
  },
  differenceAmount: {
    type: Number,
    default: 0,
  },
  oldReplaceTreatment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Treatments",
  },
  relatedPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patients",
  },
  payAmount: {
    type: Number,
    default: 0,
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  treatmentRefundCondition: {
    type: String,
    enum: ["Pay", "Recieve"],
  },
  tsType: {
    type: String,
    enum: ["TS", "TSMulti", "MS"],
  },
  refundType: {
    type: String,
    enum: ["Treatment", "Refund", "CashBack"],
  },
  refundPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  relatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branches",
  },
  relatedBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccountingLists",
  },
  relatedCash: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccountingLists",
  },
  refundTotalAmount: {
    type: Number,
    default: 0,
  },
  refundPaymentType: {
    type: String,
    enum: ["Cash", "Bank"],
  },
  remark: {
    type: String,
  },
});

module.exports = mongoose.model("RefundPackages", RefundPackageSchema);
