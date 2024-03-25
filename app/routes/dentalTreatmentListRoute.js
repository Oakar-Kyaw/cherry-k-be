"use strict";

const dentalTreatmentList = require("../controllers/dentalTreatmentListController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {

    app.route('/api/dental-treatment-list')
        .post(verifyToken,catchError(dentalTreatmentList.createDentalTreatmentList))
        .put(verifyToken,catchError(dentalTreatmentList.updateDentalTreatmentList))
        
    app.route('/api/dental-treatment-list/:id')
        .get(verifyToken,catchError(dentalTreatmentList.getDentalTreatmentList))
        .delete(verifyToken,catchError(dentalTreatmentList.deleteDentalTreatmentList)) 
        .post(verifyToken,catchError(dentalTreatmentList.activateDentalTreatmentList))

    app.route('/api/dental-treatment-lists').get(verifyToken,catchError(dentalTreatmentList.listAllDentalTreatmentLists))

    app.route('/api/dental-treatment-lists/mobile').get(catchError(DentalTreatmentList.listAllDentalTreatmentLists))

    app.route('/api/dental-treatment-lists-filter')
        .get(verifyToken,catchError(DentalTreatmentList.filterDentalTreatmentLists))

    app.route('/api/dental-treatment-lists-search')
        .post(verifyToken,catchError(DentalTreatmentList.searchDentalTreatmentLists))
        
    app.route('/api/dental-treatment-lists/treatment/:id').get(verifyToken,catchError(DentalTreatmentList.getRelatedDentalTreatments))
};
