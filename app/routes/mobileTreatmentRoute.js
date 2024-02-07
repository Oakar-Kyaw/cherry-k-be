'use strict'

const MobileTreatment = require("../controllers/mobileTreatmentController")

module.exports = (app) => {
    app.route("/api/mobile/treatments")
       .get(MobileTreatment.getAllTreatment)

    app.route("/api/mobile/treatment")
       .get(MobileTreatment.getFilterTreatment)
}