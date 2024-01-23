"use strict"


const { listAllTransferAmountFromHo, createTransferAmountFromHO, getTransferFromHOById, updateTransferFromHOById, deleteTransferFromHOById } = require("../controllers/transferFromHoController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");

module.exports = app =>{

    // Transfer Report From HO
    app.route('/api/transfer-report')
       .get(verifyToken, catchError(listAllTransferAmountFromHo))
       .post(verifyToken, catchError(createTransferAmountFromHO))

    // Transfer Report By Id
    app.route("/api/transfer-report/:id")
       .get(verifyToken, catchError(getTransferFromHOById))
       .put(verifyToken, catchError(updateTransferFromHOById))
       .delete(verifyToken, catchError(deleteTransferFromHOById))
}