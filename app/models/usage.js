"use strict";

const mongoose = require("mongoose");
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;

let UsageSchema = new Schema({
  relatedTreatmentSelection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TreatmentSelections",
    required: true,
  },
  relatedAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointments",
  },
  procedureMedicine: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProcedureItems",
      },
      stock: Number,
      actual: Number,
      remark: String,
      quantity: Number,
      perUsageQTY: Number,
    },
  ],
  procedureAccessory: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AccessoryItems",
      },
      stock: Number,
      actual: Number,
      remark: String,
      quantity: Number,
      perUsageQTY: Number,
    },
  ],
  generalItem: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GeneralItems",
      },
      stock: Number,
      actual: Number,
      remark: String,
      quantity: Number,
      perUsageQTY: Number,
    },
  ],
  machine: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FixedAssets",
      },
      stock: Number,
      actual: Number,
      remark: String,
      quantity: Number,
      perUsageQTY: Number,
    },
  ],
  isDeleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  relatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branches",
  },
  machineError: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FixedAssets",
      },
      stock: Number,
      actual: Number,
      remark: String,
      quantity: Number,
      perUsageQTY: Number,
    },
  ],
  procedureItemsError: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProcedureItems",
      },
      stock: Number,
      actual: Number,
      remark: String,
      quantity: Number,
      perUsageQTY: Number,
    },
  ],
  accessoryItemsError: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AccessoryItems",
      },
      stock: Number,
      actual: Number,
      remark: String,
      quantity: Number,
      perUsageQTY: Number,
    },
  ],
  noProcedureItemsStock: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProcedureItems",
      },
      stock: Number,
      actual: Number,
      remark: String,
      quantity: Number,
      perUsageQTY: Number,
    },
  ],
  noAccessoryItemsStock: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AccessoryItems",
      },
      stock: Number,
      actual: Number,
      remark: String,
      quantity: Number,
      perUsageQTY: Number,
    },
  ],
  generalItemsError: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GeneralItems",
      },
      stock: Number,
      actual: Number,
      remark: String,
      quantity: Number,
      perUsageQTY: Number,
    },
  ],
  noGeneralItemsStock: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GeneralItems",
      },
      stock: Number,
      actual: Number,
      remark: String,
      quantity: Number,
      perUsageQTY: Number,
    },
  ],
  usageStatus: {
    type: String,
    enum: ["Pending", "In Progress", "Finished"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Usages", UsageSchema);

//Author: Kyaw Zaw Lwin
