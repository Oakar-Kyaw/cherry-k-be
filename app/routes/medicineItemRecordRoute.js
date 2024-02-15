const MedicineItemRecord  = require("../controllers/medicineItemRecordController")
const { catchError } = require("../lib/errorHandler")
const verifyToken = require("../lib/verifyToken")

module.exports = (app) => {
    app.route("/api/items/issue-to-clinic/medicine")
       .get( verifyToken, catchError(MedicineItemRecord.listAllMedicineItemRecord))

    app.route("/api/items/issue-to-clinic/medicine/:id")
       .get(verifyToken, catchError(MedicineItemRecord.getSpecificMedicineItemRecord))
       .put(verifyToken, catchError(MedicineItemRecord.editMedicineItemRecord))
       .delete(verifyToken, catchError(MedicineItemRecord.deleteMedicineItemRecord))
}