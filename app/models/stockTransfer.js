'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;

let StockTransferSchema = new Schema({
    procedureMedicine: [{
        item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProcedureItems'
        },
        stockQty: Number,
        requestedQty: Number,
        transferQty: Number,
        purchasePrice: Number,
        totalPrice: Number,
          expiredDate:Date,
           alertDate:Date,
        
    }],
    medicineLists: [{
        item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MedicineItems'
        },
        stockQty: Number,
        requestedQty: Number,
        transferQty: Number,
        purchasePrice: Number,
        totalPrice: Number,
          expiredDate:Date,
           alertDate:Date,
    }],
    procedureAccessory: [{
        item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AccessoryItems'
        },
        stockQty: Number,
        requestedQty: Number,
        transferQty: Number,
        purchasePrice: Number,
        totalPrice: Number,
          expiredDate:Date,
           alertDate:Date,
    }],
    generalItems: [{
        item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GeneralItems'
        },
        stockQty: Number,
        requestedQty: Number,
          transferQty: Number,
        purchasePrice: Number,
         totalPrice: Number,
           expiredDate:Date,
           alertDate:Date,
    }],
    relatedBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branches'
    },
    date: {
        type: Date
    },
    requestNo: {
        type: String
    },
    requestedBy: {
        type: String
    },
      transferNo: {
        type: String
    },
    transferBy: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    seq: {
        type: Number
    },
    totalPrice: {
        type: Number
    }

});

module.exports = mongoose.model('StockTransfers', StockTransferSchema);

//Author: Kyaw Zaw Lwin
