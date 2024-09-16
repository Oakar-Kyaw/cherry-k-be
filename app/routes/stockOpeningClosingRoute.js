"use strict";

const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");
const {
  getStockSummaryByQty,
  transferToHo,
} = require("../controllers/stockOpeningClosingController");

module.exports = (app) => {
  app
    .route("/api/v1/stock/opening-closing")
    .get(catchError(getStockSummaryByQty));

  app.route("/api/v1/stock/transfer-to-ho").get(catchError(transferToHo));
};
