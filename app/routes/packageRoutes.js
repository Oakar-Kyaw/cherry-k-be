"use strict";

const packages = require("../controllers/packageController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');

module.exports = (app) => {

    app.route('/api/package')
        .post(verifyToken, catchError(packages.createPackage))

    app.route('/api/package/:id')
        .get(verifyToken, catchError(packages.getPackage))
        .put(verifyToken, catchError(packages.updatePackage))
        .delete(verifyToken, catchError(packages.deletePackage))
        .post(verifyToken, catchError(packages.activatePackage))

    app.route('/api/packages').get(verifyToken, catchError(packages.listAllPackages))

};
