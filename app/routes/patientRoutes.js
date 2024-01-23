"use strict";

const patient = require("../controllers/patientController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");
const upload = require('../lib/fieldUploader').upload;

module.exports = (app) => {

    app.route('/api/patient')
        .post(verifyToken, upload, catchError(patient.createPatient))
        .put(verifyToken, upload, catchError(patient.updatePatient))

    app.route('/api/patient/:id')
        .get(verifyToken, catchError(patient.getPatient))
        .delete(verifyToken, catchError(patient.deletePatient))
        .post(verifyToken, catchError(patient.activatePatient))

    app.route('/api/patients').get(verifyToken, catchError(patient.listAllPatients))

    app.route('/api/patients-filter')
        .get(verifyToken, catchError(patient.filterPatients))

    app.route('/api/patients-search')
        .post(verifyToken, catchError(patient.searchPatients))

    app.route('/api/patients/history-and-patient/:id').get(verifyToken, catchError(patient.getHistoryAndPhysicalExamination))
};
