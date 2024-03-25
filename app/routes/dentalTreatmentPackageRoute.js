"use strict";

const dentalTreatmentPackage = require("../controllers/dentalTreatmentPackageController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {

    app.route('/api/dental-treatment-package')
        .post(catchError(dentalTreatmentPackage.createTreatmentPackage))
        
    app.route('/api/dental-treatment-package/:id')
        .get(catchError(dentalTreatmentPackage.getDentalTreatmentPackageById))
        .delete(catchError(dentalTreatmentPackage.deleteDentalTreatmentPackageById)) 
        .put(catchError(dentalTreatmentPackage.updateDentalTreatmentPackageById))

    app.route('/api/dental-treatment-packages').get(catchError(treatmentPackage.listAllDentalTreatmentPackage))

};
