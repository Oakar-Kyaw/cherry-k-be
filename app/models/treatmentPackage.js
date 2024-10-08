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
  },
  TCLEstimateTotalPrice: {
    type: Number,
  },
  SOKSellingPrice: {
    type: Number,
  },
  SOKEstimateTotalPrice: {
    type: Number,
  },
  TGISellingPrice: {
    type: Number,
  },
  TGIEstimateTotalPrice: {
    type: Number,
  },
  EightMileSellingPrice: {
    type: Number,
  },
  EightMileEstimateTotalPrice: {
    type: Number,
  },
  NPTSellingPrice: {
    type: Number,
  },
  NPTEstimateTotalPrice: {
    type: Number,
  },
  LSHSellingPrice: {
    type: Number,
  },
  LSHEstimateTotalPrice: {
    type: Number,
  },
  MDYSellingPrice: {
    type: Number,
  },
  MDYEstimateTotalPrice: {
    type: Number,
  },
  KShoppingSellingPrice: {
    type: Number,
  },
  KShoppingEstimateTotalPrice: {
    type: Number,
  },
  SanChaungSellingPrice: {
    type: Number,
  },
  SanChaungEstimateTotalPrice: {
    type: Number,
  },
  ThingangyunSellingPrice: {
    type: Number,
  },
  ThingangyunEstimateTotalPrice: {
    type: Number,
  },
  HlaingTharYarSellingPrice: {
    type: Number,
  },
  HlaingTharYarEstimateTotalPrice: {
    type: Number,
  },
  TamweSellingPrice: {
    type: Number,
  },
  TamweEstimateTotalPrice: {
    type: Number,
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
