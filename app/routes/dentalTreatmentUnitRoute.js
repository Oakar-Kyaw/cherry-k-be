"use strict";

const dentalTreatmentUnit = require("../controllers/dentalTreatmentUnitController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {

    app.route('/api/dental-treatment-unit')
        .post(verifyToken,catchError(dentalTreatmentUnit.createDentalTreatmentUnit))
        .put(verifyToken,catchError(dentalTreatmentUnit.updateDentalTreatmentUnit))
        
    app.route('/api/dental-treatment-unit/:id')
        .get(verifyToken,catchError(dentalTreatmentUnit.getDentalTreatmentUnit))
        .delete(verifyToken,catchError(dentalTreatmentUnit.deleteDentalTreatmentUnit)) 
        .post(verifyToken,catchError(dentalTreatmentUnit.activateDentalTreatmentUnit))

    app.route('/api/dental-treatment-units').get(verifyToken,catchError(dentalTreatmentUnit.listAllDentalTreatmentUnits))

};
