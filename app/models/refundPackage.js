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
  replaceTreatmentId: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Treatments",
      },
    },
  ],
  relatedPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patients",
  },
  tsType: {
    type: String,
    enum: ["TS", "TSMulti"],
  },
  refundType: {
    type: String,
    enum: ["Treatment", "Package"],
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
});

module.exports = mongoose.model("RefundPackages", RefundPackageSchema);
