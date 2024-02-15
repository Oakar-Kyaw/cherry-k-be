const GeneralItemRecord = require("../controllers/generalItemRecordController")
const { catchError } = require("../lib/errorHandler")
const verifyToken = require("../lib/verifyToken")

module.exports = (app) => {
    app.route("/api/items/issue-to-clinic/general")
       .get( verifyToken, catchError(GeneralItemRecord.listAllGeneralItemRecord))

    app.route("/api/items/issue-to-clinic/general/:id")
       .get(verifyToken, catchError(GeneralItemRecord.getSpecificGeneralItemRecord))
       .put(verifyToken, catchError(GeneralItemRecord.editGeneralItemRecord))
       .delete(verifyToken, catchError(GeneralItemRecord.deleteGeneralItemRecord))
}