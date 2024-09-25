"use strict";

const treatmentPackage = require("../controllers/treatmentPackageController");
const { catchError } = require("../lib/errorHandler");
const { createAccountList } = require("../lib/generalFunction");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {
  app
    .route("/api/treatment-package")
    .post(verifyToken, catchError(treatmentPackage.createTreatmentPackage));

  app
    .route("/api/treatment-package/:id")
    .get(verifyToken, catchError(treatmentPackage.getTreatmentPackageById))
    .delete(
      verifyToken,
      catchError(treatmentPackage.deleteTreatmentPackageById)
    )
    .put(verifyToken, catchError(treatmentPackage.updateTreatmentPackageById));

  app
    .route("/api/treatment-packages")
    .get(catchError(treatmentPackage.listAllTreatmentPackage));
};
