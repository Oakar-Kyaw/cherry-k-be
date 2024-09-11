"use strict";

const mongoose = require("mongoose");
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;

let StockOpeningClosingSchema = new Schema({
  relatedMedicineItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MedicineItems",
  },
  relatedProcedureItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProcedureItems",
  },
  relatedAccessoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccessoryItems",
  },
  relatedGeneralItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GeneralItems",
  },
  openingStock: {
    type: Number,
    default: 0,
  },
  closingStock: {
    type: Number,
    default: 0,
  },
  purchaseStock: {
    type: Number,
    default: 0,
  },
  transferStock: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    index: true,
  },
  relatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branches",
  },
});

module.exports = mongoose.model(
  "StockOpeningClosing",
  StockOpeningClosingSchema
);
