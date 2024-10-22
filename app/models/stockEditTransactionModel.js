"use strict";

const mongoose = require("mongoose");
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;

let StockEditTransactionSchema = new Schema({
  relatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branches",
  },
  relatedEditUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  relatedGeneralItems: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GeneralItems",
  },
  relatedProcedureItems: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProcedureItems",
  },
  relatedMedicineItems: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MedicineItems",
  },
  relatedAccessoryItems: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccessoryItems",
  },
  relatedMachine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FixedAssets",
  },
  editQty: {
    type: Number,
  },
  editTotalUnit: {
    type: Number,
  },
  currentQty: {
    type: Number,
  },
  totalUnit: {
    type: Number,
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  location: {
    type: String,
  },
  editTime: {
    type: String,
  },
  editEmail: {
    type: String,
  },
  editPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
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

module.exports = mongoose.model(
  "StockEditTransactions",
  StockEditTransactionSchema
);

//Author: Oakar Kyaw
