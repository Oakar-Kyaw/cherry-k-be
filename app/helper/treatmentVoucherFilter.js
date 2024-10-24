"use strict";

const mongoose = require("mongoose");
const PatientModels = require("../models/patient");

exports.getTreatmentVoucherWithCustomerPhone = async (phone) => {
  try {
    const result = await PatientModels.aggregate([
      {
        $match: {
          phone: new RegExp(phone, "i"),
          isDeleted: false,
        },
      },

      {
        $lookup: {
          from: "treatmentvouchers",
          localField: "_id",
          foreignField: "relatedPatient",
          as: "relatedVouchers",
        },
      },

      {
        $unwind: {
          path: "$relatedVouchers",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ["$relatedVouchers", "$$ROOT"] },
        },
      },

      {
        $project: {
          patientId: "$_id",
          patientName: "$name",
          isDeleted: 1,
          createdAt: 1,
          Refund: 1,
          refundType: 1,
          refundDate: 1,
          refundReason: 1,
          refundAccount: 1,
          cashBackAmount: 1,
          newTreatmentVoucherCode: 1,
          newTreatmentVoucherId: 1,
          refundAmount: 1,
          treatmentReturn: 1,
          relatedTreatment: 1,
          relatedDentalTreatment: 1,
          secondAccount: 1,
          secondAmount: 1,
          isDouble: 1,
          relatedAppointment: 1,
          relatedPatient: 1,
          paymentMethod: 1,
          code: 1,
          relatedBank: 1,
          relatedCash: 1,
          paymentType: 1,
          seq: 1,
          relatedTreatmentSelection: 1,
          relatedTreatmentPackageSelection: 1,
          relatedDentalTreatmentSelection: 1,
          deliveryDate: 1,
          deliveryPerson: 1,
          deliveryDescription: 1,
          relatedBranch: 1,
          bankType: 1,
          createdBy: 1,
          relatedAccounting: 1,
          saleReturnType: 1,
          remark: 1,
          totalDiscount: 1,
          totalAmount: 1,
          paidAmount: 1,
          balance: 1,
          totalPaidAmount: 1,
          payment: 1,
          relatedTreatmentPackage: 1,
          relatedDentalTreatmentPackage: 1,
          relatedPackageSelection: 1,
          relatedPackage: 1,
          relatedDiscount: 1,
          discountAmount: 1,
          discountType: 1,
          tsType: 1,
          msTotalAmount: 1,
          msTotalDiscountAmount: 1,
          msPaidAmount: 1,
          msChange: 1,
          msGrandTotal: 1,
          msBalance: 1,
          psGrandTotal: 1,
          psBalance: 1,
          psPaidAmount: 1,
          multiTreatment: 1,
          multiDentalTreatment: 1,
          tvDiscount: 1,
          amount: 1,
          medicineItems: 1,
          relatedTransaction: 1,
          relatedDoctor: 1,
          purchaseType: 1,
          deposit: 1,
          relatedRepay: 1,
          status: 1,
          isMedicineProduct: 1,
        },
      },
    ]);

    return result;
  } catch (error) {
    console.error(error);
    throw new Error(
      "Error while getting treatment voucher with customer phone"
    );
  }
};
