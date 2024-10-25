const {
  createRefundVoucher,
  RefundPackage,
} = require("../controllers/refundVoucherController");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {
  app.route("/api/refund").post(verifyToken, createRefundVoucher);

  app.route("/api/v1/refund-package").post(RefundPackage);
};
