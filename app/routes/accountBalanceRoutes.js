"use strict";

const { verify } = require("crypto");
const accountBalance = require("../controllers/accountBalanceController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {
  app
    .route("/api/account-balance")
    .post(verifyToken, catchError(accountBalance.createAccountBalance))
    .put(verifyToken, catchError(accountBalance.updateAccountBalance));

  app
    .route("/api/account-balance/:id")
    .get(verifyToken, catchError(accountBalance.getAccountBalance))
    .delete(verifyToken, catchError(accountBalance.deleteAccountBalance))
    .post(verifyToken, catchError(accountBalance.activateAccountBalance));

  app
    .route("/api/account-balances/opening-closing")
    .get(catchError(accountBalance.getOpeningAndClosingWithExactDate));

  app
    .route("/api/v1/account-balances/opening-closing")
    .get(
      catchError(accountBalance.getOpeningAndClosingCashAndBankWithExactData)
    );

  app
    .route("/api/account-balances/knas/opening-closing")
    .get(catchError(accountBalance.knasGetOpeningAndClosingWithExactDate));

  app
    .route("/api/account-balances/transfer-closing")
    .post(verifyToken, catchError(accountBalance.accountBalanceTransfer));

  app
    .route("/api/account-balances")
    .get(verifyToken, catchError(accountBalance.listAllAccountBalances));
  app
    .route("/api/account-balances/closing")
    .get(verifyToken, catchError(accountBalance.getClosing))
    .post(
      verifyToken,
      catchError(accountBalance.getOpeningClosingWithExactDate)
    );
};
