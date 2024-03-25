"use strict";

const dentalTreatmentSelection = require("../controllers/dentalTreatmentSelectionController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');
const upload = require('../lib/fieldUploader').upload;

module.exports = (app) => {

    app.route('/api/dental-treatment-selection')
        .post(verifyToken, upload, catchError(dentalTreatmentSelection.createDentalTreatmentSelection))
        .put(verifyToken, catchError(dentalTreatmentSelection.updateDentalTreatmentSelection))

    app.route('/api/dental-treatment-selection/:id')
        .get(verifyToken, catchError(dentalTreatmentSelection.getDentalTreatmentSelection))
        .delete(verifyToken, catchError(dentalTreatmentSelection.deleteDentalTreatmentSelection))
        .post(verifyToken, catchError(dentalTreatmentSelection.activateDentalTreatmentSelection))

    app.route('/api/dental-treatment-selections')
        .get(verifyToken, catchError(dentalTreatmentSelection.listAllDentalTreatmentSelections));

    app.route('/api/dental-treatment-selections/multi')
        .post(verifyToken, upload, catchError(dentalTreatmentSelection.createMultiDentalTreatmentSelection))
        .get(verifyToken, catchError(dentalTreatmentSelection.listMultiDentalTreatmentSelections))

    app.route('/api/dental-treatment-selections/transaction').post(verifyToken, catchError(dentalTreatmentSelection.createDentalTreatmentTransaction))
    app.route('/api/dental-treatment-selections/treatment/:id').get(verifyToken, catchError(dentalTreatmentSelection.getDentalTreatementSelectionByTreatmentID))
    app.route('/api/dental-treatment-selections/payment').put(verifyToken, upload, catchError(dentalTreatmentSelection.dentalTreatmentPayment))
    app.route('/api/dental-treatment-selections/filter').post(verifyToken, catchError(dentalTreatmentSelection.getRelatedDentalTreatmentSelections))
    app.route('/api/dental-treatment-selections/search').post(verifyToken, catchError(dentalTreatmentSelection.searchDentalTreatmentSelections))
    app.route('/api/dental-treatment-selections/code').get(verifyToken, catchError(dentalTreatmentSelection.createDentalTreatmentSelectionCode))
    app.route('/api/dental-treatment-selections/top-ten').get(verifyToken, catchError(dentalTreatmentSelection.TopTenFilter))

};
