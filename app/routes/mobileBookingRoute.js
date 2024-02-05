"use strict"

const MobileBooking = require("../controllers/mobileBookingController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');

module.exports = (app) => {
    app.route("/api/mobile/booking")
       .post( MobileBooking.createMobileBooking )
       .get( MobileBooking.getAllMobileBooking )

    app.route("/api/mobile/booking/:id")
       .put( MobileBooking.updateMobileBooking )
       .delete( MobileBooking.deleteMobileBooking)
}
