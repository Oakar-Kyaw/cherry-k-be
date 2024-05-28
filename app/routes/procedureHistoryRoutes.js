"use strict";

const procedureHistory = require("../controllers/procedureHistoryController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');
const upload = require('../lib/fieldUploader');

module.exports = (app) => {

    app.route('/api/procedure-history')
        .post(upload.array("procedurehistory",5), catchError(procedureHistory.createProcedureHistory))
        .put(upload.array("procedurehistory",5), verifyToken, catchError(procedureHistory.updateProcedureHistory))

    app.route('/api/procedure-history/:id')
        .get(verifyToken, catchError(procedureHistory.getProcedureHistory))
        .delete(verifyToken, catchError(procedureHistory.deleteProcedureHistory))
        .post(verifyToken, catchError(procedureHistory.activateProcedureHistory))

    app.route('/api/procedure-history-upload')
        .post(upload.array("procedurehistory",5), verifyToken, catchError(procedureHistory.uploadImage))

    app.route('/api/procedure-histories').get(verifyToken, catchError(procedureHistory.listAllProcedureHistorys))

    app.route('/api/procedure-histories/filter').get(verifyToken, catchError(procedureHistory.getRelatedProcedureHistory))
};
