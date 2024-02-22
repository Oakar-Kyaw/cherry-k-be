const TransferToHoRequest  = require("../controllers/transferToHoRequestController")
const { catchError } = require("../lib/errorHandler")
const verifyToken = require("../lib/verifyToken")


module.exports = (app) => {
    app.route("/api/transfer-to-ho-request")
       .post(verifyToken, catchError(TransferToHoRequest.createTransferToHoRequest))
    //transfer to ho request by id
    app.route("/api/transfer-to-ho-request/:id")
       .get(verifyToken, catchError(TransferToHoRequest.getTransferToHOById))
       .put(verifyToken, catchError(TransferToHoRequest.updateTransferToHoRequestById))
       .delete(verifyToken, catchError(TransferToHoRequest.deleteTransferToHORequestById))
}