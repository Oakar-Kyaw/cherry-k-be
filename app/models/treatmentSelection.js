"use strict";

const mongoose = require("mongoose");
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;

let TreatmentSelectionSchema = new Schema({
  code: {
    type: String,
  },
  paymentMethod: {
    type: String,
    enum: ["Paid", "Partial"],
  },
  categories: {
    type: String,
    enum: ["Package", "Standalone"],
  },
  paidAmount: {
    type: Number,
  },
  leftOverAmount: {
    type: Number,
  },
  Refund: {
    type: Boolean,
    default: false,
  },
  totalAmount: {
    type: Number,
  },
  perAppointmentPrice: {
    type: Number,
    default: 0,
  },
  actualRevenue: {
    type: Number,
    default: 0,
  },
  deferRevenue: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  combineSaleActive: {
    type: Boolean,
    default: false,
  },
  msPaidAmount: {
    type: Number,
    default: 0,
  },
  treatmentPaidAmount: {
    type: Number,
    default: 0,
  },
  relatedBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccountingLists",
  },
  relatedCash: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccountingLists",
  },
  secondAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccountingLists",
  },
  secondAmount: {
    type: Number,
    default: 0,
  },
  isDouble: {
    type: Boolean,
  },
  bankType: {
    type: String,
    enum: ["Normal", "POS", "Pay"],
  },
  multiTreatment: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Treatments",
      },
      discountAmount: Number,
      price: Number,
      qty: Number,
    },
  ],
  relatedTreatment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Treatments",
  },
  relatedTreatmentList: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TreatmentLists",
  },
  relatedAppointments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Appointments",
  },
  selectionStatus: {
    type: String,
    enum: ["Ongoing", "Done", "Due"],
    default: "Due",
  },
  relatedPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patients",
  },
  finishedAppointments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Appointments",
  },
  remainingAppointments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Appointments",
  },
  relatedTransaction: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Transactions",
  },
  inBetweenDuration: {
    type: Number,
  },
  bodyParts: {
    type: String,
    enum: ["Face", "Body", "Body Injection"],
  },
  treatmentTimes: {
    type: Number,
  },
  seq: {
    type: Number,
  },
  relatedTreatmentVoucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TreatmentVouchers",
  },
  relatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branches",
  },
  paymentStatus: {
    type: Boolean,
  },
  paymentMethod: {
    type: String,
    enum: ["Partial", "Paid"],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  saleReturnFlag: {
    type: Boolean,
    default: false,
  },
  purchaseType: {
    type: String,
    enum: ["Normal", "Solid Beauty"],
  },
  remark: {
    type: String,
  },
  tsType: {
    type: String,
    enum: ["TS", "TSMulti"],
  },
  multiTreatment: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Treatments",
      },
      discountAmount: Number,
      price: Number,
      qty: Number,
      treatmentVoucher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TreatmentVouchers",
      },
    },
  ],
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
  dueDate: {
    type: Date,
    default: Date.now,
  },
});
const patient = mongoose.model("TreatmentSelections", TreatmentSelectionSchema);
module.exports = patient;

//Author: Kyaw Zaw Lwin
