"use strict";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const treatmentPackageSchema = Schema({
  isDeleted: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  relatedAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccountingLists",
  },
  relatedTreatment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Treatments",
    },
  ],
  relatedTreatmentList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TreatmentLists",
    },
  ],
  TCLSellingPrice: {
    type: Number,
    default: 0,
  },
  TCLEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  SOKSellingPrice: {
    type: Number,
    default: 0,
  },
  SOKEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  TGISellingPrice: {
    type: Number,
    default: 0,
  },
  TGIEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  EightMileSellingPrice: {
    type: Number,
    default: 0,
  },
  EightMileEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  NPTSellingPrice: {
    type: Number,
    default: 0,
  },
  NPTEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  LSHSellingPrice: {
    type: Number,
    default: 0,
  },
  LSHEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  MDYSellingPrice: {
    type: Number,
    default: 0,
  },
  MDYEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  KShoppingSellingPrice: {
    type: Number,
    default: 0,
  },
  KShoppingEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  SanChaungSellingPrice: {
    type: Number,
    default: 0,
  },
  SanChaungEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  ThingangyunSellingPrice: {
    type: Number,
    default: 0,
  },
  ThingangyunEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  HlaingTharYarSellingPrice: {
    type: Number,
    default: 0,
  },
  HlaingTharYarEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  TamweSellingPrice: {
    type: Number,
    default: 0,
  },
  TamweEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  LMDSellingPrice: {
    type: Number,
    default: 0,
  },
  LMDEstimateTotalPrice: {
    type: Number,
    default: 0,
  },
  relatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branches",
  },
  status: {
    type: String,
    default: "Active",
    enum: ["Active", "Deactivate"],
  },
  expireAt: {
    type: Date,
    index: {
      expireAfterSeconds: 1,
    },
  },
  editTime: {
    type: String,
  },
  editPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  editEmail: {
    type: String,
  },
  location: {
    type: String,
  },
  deleteTime: {
    type: String,
  },
  deletePerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  deleteEmail: {
    type: String,
  },
});

module.exports = new mongoose.model(
  "TreatmentPackages",
  treatmentPackageSchema
);
