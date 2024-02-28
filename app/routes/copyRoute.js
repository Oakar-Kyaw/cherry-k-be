
"use strict";

const { createCopyBranch, deleteCopy } = require("../controllers/copyController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');

module.exports = (app) => {
    app.route('/api/copybranch')
        .post( catchError(createCopyBranch))
        .delete(catchError(deleteCopy))
  
};
