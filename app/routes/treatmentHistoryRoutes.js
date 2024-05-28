"use strict";

const treatmentHistory = require("../controllers/treatmentHistoryController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');
const upload = require('../lib/fieldUploader');

module.exports = (app) => {

    app.route('/api/treatment-history')
        .post(upload.array("treatmenthistory",5),verifyToken,catchError(treatmentHistory.createTreatmentHistory))
        .put(upload.array("treatmenthistory",5) ,verifyToken,catchError(treatmentHistory.updateTreatmentHistory))
        
    app.route('/api/treatment-history/:id')
        .get( verifyToken,catchError(treatmentHistory.getTreatmentHistory))
        .delete(verifyToken,catchError(treatmentHistory.deleteTreatmentHistory)) 
        .post( verifyToken,catchError(treatmentHistory.activateTreatmentHistory))

    app.route('/api/treatment-histories').get(verifyToken,catchError(treatmentHistory.listAllTreatmentHistorys))
};
