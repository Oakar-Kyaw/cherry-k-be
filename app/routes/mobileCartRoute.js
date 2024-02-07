"use strict"

const verifyToken = require("../lib/verifyToken")
const { catchError } = require("../lib/errorHandler");
const MobileCart = require("../controllers/mobileCartController");

module.exports = (app) => {
    app.route("/api/mobile/carts")
       .get(MobileCart.getAllMobileCart)
       .post(MobileCart.createMobileCart)

    app.route("/api/mobile/cart/:id")
       .put(MobileCart.updateCartById)
}
