"use strict";

const treatmentVoucher = require("../controllers/treatmentVoucherController");
// const { exportExcel } = require("../excelTest/excelOutput");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {
  //post and put for treatment-voucher
  app
    .route("/api/treatment-voucher")
    .post(verifyToken, catchError(treatmentVoucher.createTreatmentVoucher))
    .put(verifyToken, catchError(treatmentVoucher.updateTreatmentVoucher));

  app
    .route("/api/treatment-voucher/:id")
    .get(verifyToken, catchError(treatmentVoucher.getTreatmentVoucher))
    .delete(catchError(treatmentVoucher.deleteTreatmentVoucher))
    .post(verifyToken, catchError(treatmentVoucher.activateTreatmentVoucher));

  app
    .route("/api/treatment-vouchers")
    .get(verifyToken, catchError(treatmentVoucher.listAllTreatmentVouchers));
  app
    .route("/api/treatment-vouchers/search")
    .post(verifyToken, catchError(treatmentVoucher.searchTreatmentVoucher));
  app
    .route("/api/treatment-vouchers/code/ms")
    .get(verifyToken, catchError(treatmentVoucher.getCodeMS));
  app
    .route("/api/treatment-vouchers/filter")
    .post(verifyToken, catchError(treatmentVoucher.getRelatedTreatmentVoucher));
  app
    .route("/api/treatment-vouchers/code")
    .get(verifyToken, catchError(treatmentVoucher.getCode));
  app
    .route("/api/treatment-vouchers/today")
    .get(verifyToken, catchError(treatmentVoucher.getTodaysTreatmentVoucher));
  app
    .route("/api/treatment-vouchers/get-date")
    .get(verifyToken, catchError(treatmentVoucher.getwithExactDate));

  app
    .route("/api/treatment-vouchers/TV-Filter")
    .get(catchError(treatmentVoucher.TreatmentVoucherFilter));

  app
    .route("/api/treatment-voucher/v1/TV-Filter")
    .get(catchError(treatmentVoucher.VersionOneTreatmentVoucherFilter));

  app
    .route("/api/treatment-vouchers/v1/TV-Filter/bank")
    .get(catchError(treatmentVoucher.NewTreatmentVoucherFilter));

  app
    .route("/api/treatment-vouchers/TV-Filter/bank-tsmulti")
    .get(catchError(treatmentVoucher.treatmentFilterWithBankTSMulti));

  app
    .route("/api/treatment-voucher/TV-Filter/cash-tsmulti")
    .get(catchError(treatmentVoucher.treatmentFilterWithCashTSMulti));

  app
    .route("/api/treatment-vouchers/TV-Filter/bank-ms")
    .get(catchError(treatmentVoucher.treatmentFilterWithBankMS));

  app
    .route("/api/treatment-vouchers/TV-Filter/cash-ms")
    .get(catchError(treatmentVoucher.treatmentFilterWithCashMS));

  app
    .route("/api/v1/treatment-vouchers/list")
    .get(catchError(treatmentVoucher.showAllTreatmentVouchers));

  app
    .route("/api/v1/treatment-vouchers/TV-Filter/cash")
    .get(catchError(treatmentVoucher.NewTreatmentVoucherFilterCash));

  app
    .route("/api/treatment-vouchers/ms/single")
    .post(verifyToken, catchError(treatmentVoucher.createSingleMedicineSale));
  app
    .route("/api/treatment-vouchers/ms/combine")
    .put(verifyToken, catchError(treatmentVoucher.combineMedicineSale));
  app
    .route("/api/treatment-vouchers/treatment-selection/:id")
    .get(
      verifyToken,
      catchError(treatmentVoucher.getTreatmentVoucherWithTreatmentID)
    );
  app
    .route("/api/treatment-vouchers/filter")
    .get(verifyToken, catchError(treatmentVoucher.filterTreatmentVoucher));
  app
    .route("/api/treatment-vouchers/data/medicine/excel")
    .get(
      catchError(
        verifyToken,
        treatmentVoucher.createSpecificItemExcelForTreatmentVoucher
      )
    );
  // app.route("/api/v1/treatment-vouchers/excels")
  //     .get(catchError(exportExcel))

  // Add delivery date to voucher by id, only for admin
  app
    .route("/api/treatment-vouchers/add-delivery-date/:id")
    .put(verifyToken, catchError(treatmentVoucher.addDeliveryInfo));

  app
    .route("/api/treatment-vouchers/phone-filter")
    .get(catchError(treatmentVoucher.FilterTreatmentVoucherWithPhone));
};
