"use strict"

const verifyToken = require("../lib/verifyToken")
const { catchError } = require("../lib/errorHandler");
const MobileCart = require("../controllers/mobileCartController");

module.exports = (app) => {
    app.route("/api/mobile/cart")
       .get(verifyToken)
       .post(MobileCart.createMobileCart)
}
