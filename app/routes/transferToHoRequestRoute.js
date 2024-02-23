const TransferToHoRequest  = require("../controllers/transferToHoRequestController")
const { catchError } = require("../lib/errorHandler")
const verifyToken = require("../lib/verifyToken")


module.exports = (app) => {
    app.route("/api/transfer-to-ho-request")
       .post(verifyToken, catchError(TransferToHoRequest.createTransferToHoRequest))
    //list all transfer to ho request 
    app.route("/api/transfer-to-ho-requests")
       .get(verifyToken, catchError(TransferToHoRequest.listAllTransferToHoRequest))
    //transfer to ho request by id
    app.route("/api/transfer-to-ho-request/:id")
       .get(verifyToken, catchError(TransferToHoRequest.getTransferToHOById))
       .put(verifyToken, catchError(TransferToHoRequest.updateTransferToHoRequestById))
       .delete(verifyToken, catchError(TransferToHoRequest.deleteTransferToHORequestById))
   
   //generate request items's code
   app.route("/api/transfer-to-ho-requests/get-code")
      .get(catchError(TransferToHoRequest.getTransferToHoCode))
}