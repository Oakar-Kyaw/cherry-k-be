"use strict";

const treatmentPackage = require("../controllers/treatmentPackageController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {

    app.route('/api/treatment-package')
        .post(catchError(treatmentPackage.createTreatmentPackage))
        
    app.route('/api/treatment-package/:id')
        .get(catchError(treatmentPackage.getTreatmentPackageById))
        .delete(catchError(treatmentPackage.deleteTreatmentPackageById)) 
        .put(catchError(treatmentPackage.updateTreatmentPackageById))

    app.route('/api/treatment-packages').get(catchError(treatmentPackage.listAllTreatmentPackage))

};
