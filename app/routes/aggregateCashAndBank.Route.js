"use strict";

const aggregateCashAndBank = require("../../app/TotalReportAggregate/cashAndBankAggregate");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {
  app
    .route("/api/aggregate-cash-bank")
    .get(catchError(aggregateCashAndBank.AggregateRepayment));
};
