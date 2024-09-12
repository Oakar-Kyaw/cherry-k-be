"use strict";

const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");
const {
  getOpeningClosingStock,
  getStockSummaryByQty,
} = require("../controllers/stockOpeningClosingController");

module.exports = (app) => {
  app
    .route("/api/v1/stock/opening-closing")
    .get(catchError(getStockSummaryByQty));
};
