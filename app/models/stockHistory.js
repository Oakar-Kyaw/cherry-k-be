"use strict";

const mongoose = require("mongoose");
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;

const StockHistorySchema = new Schema(
  {
    isDeleted: {
      type: Boolean,
      default: false,
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
    relatedGeneralItems: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeneralItems",
    },
    relatedBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branches",
    },
    openingStock: {
      type: Number,
    },
    closingStock: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StockHistory", StockHistorySchema);
