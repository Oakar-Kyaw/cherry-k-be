"use strict";

const history = require("../controllers/historyController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');
const upload = require('../lib/fieldUploader');

module.exports = (app) => {

    app.route('/api/history')
        .post(upload.array("history",5), verifyToken, catchError(history.createHistory))
        .put(upload.array("history",5), verifyToken, catchError(history.updateHistory))

    app.route('/api/history/:id')
        .get(verifyToken, catchError(history.getHistory))
        .delete(verifyToken, catchError(history.deleteHistory))
        .post(verifyToken, catchError(history.activateHistory))

    app.route('/api/histories').get(verifyToken, catchError(history.listAllHistories))

    app.route('/api/histories-filter')
        .get(verifyToken, catchError(history.filterHistories))

    app.route('/api/histories-search')
        .post(verifyToken, catchError(history.searchHistories))
};
