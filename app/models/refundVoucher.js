"use strict";

const mongoose = require("mongoose");
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;

let RefundVoucherSchema = new Schema({
    voucherCode : {
        type : String
    },
    refundAccount : {
        type: mongoose.Schema.Types.ObjectId,
        ref:"AccountingLists",
        required:true
    },
    refundVoucherId: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Vouchers",
        required:true
    },
    refundDate : {
        type : Date
    },
    reason : {
        type :String
    },
    refundType : {
        type : String,
        enum : ["CashBack","Treatment"]
    },
    cashBackAmount :{
        type : Number,
        default : 0
    }
    
})

module.exports = mongoose.model("RefundVouchers",RefundVoucherSchema);