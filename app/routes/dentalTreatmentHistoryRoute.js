"use strict";

const dentalTreatmentHistory = require("../controllers/dentalTreatmentHistoryController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');
const upload = require('../lib/fieldUploader');

module.exports = (app) => {

    app.route('/api/dental-treatment-history')
        .post(upload.array("dental",5),verifyToken,catchError(dentalTreatmentHistory.createDentalTreatmentHistory))
        .put(upload.array("dental",5) ,verifyToken,catchError(dentalTreatmentHistory.updateDentalTreatmentHistory))
        
    app.route('/api/dental-treatment-history/:id')
        .get( verifyToken,catchError(dentalTreatmentHistory.getDentalTreatmentHistory))
        .delete(verifyToken,catchError(dentalTreatmentHistory.deleteDentalTreatmentHistory)) 
        .post( verifyToken,catchError(dentalTreatmentHistory.activateDentalTreatmentHistory))

    app.route('/api/dental-treatment-histories').get(verifyToken,catchError(dentalTreatmentHistory.listAllDentalTreatmentHistorys))
};
