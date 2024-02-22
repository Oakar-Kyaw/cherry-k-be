const verifyToken = require("../lib/verifyToken")
const { catchError } = require("../lib/errorHandler");
const TransferToHoRecord = require("../controllers/transferToHoRecordController")

module.exports = (app) => {
    app.route("/api/transfer-to-hos")
       .get( verifyToken, catchError(TransferToHoRecord.listAllTransferToHo))
    
    app.route("/api/transfer-to-ho/:id")
       .get( verifyToken,catchError(TransferToHoRecord.getTransferToHOById))
       .put(verifyToken, catchError(TransferToHoRecord.updateTransferToHOById))
       .delete(verifyToken, catchError(TransferToHoRecord.deleteTransferToHOById))
}