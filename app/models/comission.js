'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;

let ComissionSchema = new Schema({
    relatedAppointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointments'
    },
    appointmentAmount: {
        type: Number
    },
    commissionAmount: {
        type: Number
    },
    relatedDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctors',
    },
    percent: {
        type: Number
    },
    date: {
        type: Date,
        default: Date.now
    },
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    },
    status: {
        type: String,
        enum: ['Claimed', 'Unclaimed'],
        default: 'Unclaimed'
    },
    relatedBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branches'
    },
    relatedTreatmentSelection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TreatmentSelections'
    },
    relatedNurse:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Nurses'
    },
    relatedTherapist:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Therapists'
    }
});

module.exports = mongoose.model('Comissions', ComissionSchema);

//Author: Kyaw Zaw Lwin
