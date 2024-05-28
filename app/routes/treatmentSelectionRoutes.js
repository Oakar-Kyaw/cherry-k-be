"use strict";

const treatmentSelection = require("../controllers/treatmentSelectionController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');
const upload = require('../lib/fieldUploader');

module.exports = (app) => {

    app.route('/api/treatment-selection')
        .post(verifyToken, upload.array("treatmentselection",5), catchError(treatmentSelection.createTreatmentSelection))
        .put(verifyToken, catchError(treatmentSelection.updateTreatmentSelection))

    app.route('/api/treatment-selection/:id')
        .get(verifyToken, catchError(treatmentSelection.getTreatmentSelection))
        .delete(verifyToken, catchError(treatmentSelection.deleteTreatmentSelection))
        .post(verifyToken, catchError(treatmentSelection.activateTreatmentSelection))

    app.route('/api/treatment-selections')
        .get(verifyToken, catchError(treatmentSelection.listAllTreatmentSelections));

    app.route('/api/treatment-selections/multi')
        .post(verifyToken, upload.array("treatmentselection",5), catchError(treatmentSelection.createMultiTreatmentSelection))
        .get(verifyToken, catchError(treatmentSelection.listMultiTreatmentSelections))

    app.route('/api/treatment-selections/transaction').post(verifyToken, catchError(treatmentSelection.createTreatmentTransaction))
    app.route('/api/treatment-selections/treatment/:id').get(verifyToken, catchError(treatmentSelection.getTreatementSelectionByTreatmentID))
    app.route('/api/treatment-selections/payment').put(verifyToken, upload.array("treatmentselection",5), catchError(treatmentSelection.treatmentPayment))
    app.route('/api/treatment-selections/filter').post(verifyToken, catchError(treatmentSelection.getRelatedTreatmentSelections))
    app.route('/api/treatment-selections/search').post(verifyToken, catchError(treatmentSelection.searchTreatmentSelections))
    app.route('/api/treatment-selections/code').get(verifyToken, catchError(treatmentSelection.createTreatmentSelectionCode))
    app.route('/api/treatment-selections/top-ten').get(verifyToken, catchError(treatmentSelection.TopTenFilter))

};
