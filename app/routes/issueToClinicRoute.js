
const IssueToClinic = require("../controllers/issueToClinicController")
const TransferToHoRequest = require("../controllers/transferToHoRequestController")
const { catchError } = require("../lib/errorHandler")
const verifyToken = require("../lib/verifyToken")


module.exports = (app) => {
    //issue to clinic route
    app.route('/api/items/issue-to-clinic').post( verifyToken,catchError(IssueToClinic.issueToClinic))
   //confirm issue to Ho from Pos route
   app.route("/api/items/issue-to-Ho/confirm").post(verifyToken, catchError(IssueToClinic.confirmIssueToHo))

}
