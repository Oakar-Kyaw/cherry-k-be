"use strict";

const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");
const {
  getOpeningClosingStock,
  getStockSummaryByDate,
} = require("../controllers/stockOpeningClosingController");

module.exports = (app) => {
  app
    .route("/api/v1/stock/opening-closing")
    .get(catchError(getStockSummaryByDate));
};