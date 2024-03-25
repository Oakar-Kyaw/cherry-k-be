"use strict";

const dentalTreatment = require("../controllers/dentalTreatmentController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');

module.exports = (app) => {
   
    app.route('/api/dental-treatment/excel/:id')
       .get(verifyToken,catchError(dentalTreatment.getDataToExportExcel))
        
    app.route('/api/dental-treatment')
        .post(verifyToken,catchError(dentalTreatment.createDentalTreatment))
        .put(verifyToken,catchError(dentalTreatment.updateDentalTreatment))

    app.route('/api/dental-treatment/:id')
        .get(verifyToken,catchError(dentalTreatment.getDentalTreatment))
        .delete(verifyToken,catchError(dentalTreatment.deleteDentalTreatment))
        .post(verifyToken,catchError(dentalTreatment.activateDentalTreatment))

    app.route('/api/dental-treatments').get(verifyToken,catchError(dentalTreatment.listAllDentalTreatments))
    app.route('/api/dental-treatment-search').post(verifyToken,catchError(dentalTreatment.searchDentalTreatments))
    app.route('/api/dental-treatments/list/:id').get(verifyToken,catchError(dentalTreatment.getRelatedDentalTreatmentByTreatmentListID))
};
