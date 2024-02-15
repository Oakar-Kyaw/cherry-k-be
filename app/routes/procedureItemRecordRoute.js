const ProcedureItemRecord   = require("../controllers/procedureItemRecordController")
const { catchError } = require("../lib/errorHandler")
const verifyToken = require("../lib/verifyToken")

module.exports = (app) => {
    app.route("/api/items/issue-to-clinic/procedure")
       .get( verifyToken, catchError(ProcedureItemRecord.listAllProcedureItemRecord))

    app.route("/api/items/issue-to-clinic/procedure/:id")
       .get(verifyToken, catchError(ProcedureItemRecord.getSpecificProcedureItemRecord))
       .put(verifyToken, catchError(ProcedureItemRecord.editProcedureItemRecord))
       .delete(verifyToken, catchError(ProcedureItemRecord.deleteProcedureItemRecord))
}