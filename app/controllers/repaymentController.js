"use strict";
const Repayment = require("../models/repayment");
const PatientTreatment = require("../models/patientTreatment");
const Transaction = require("../models/transaction");
const RepayRecord = require("../models/repayRecord");
const treatmentVoucherModel = require("../models/treatmentVoucher");
const repaymentModel = require("../models/repayment");

exports.listAllRepayments = async (req, res) => {
  let {
    keyword,
    role,
    limit,
    skip,
    relatedDebt,
    relatedPatient,
    relatedBranch,
    relatedBank,
  } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 20; //limit
    skip = +skip || 0;

    let query = { isDeleted: false },
      regexKeyword;

    role ? (query["role"] = role.toUpperCase()) : "";
    relatedDebt ? (query["relatedDebt"] = relatedDebt) : "";
    relatedPatient ? (query["relatedPatient"] = relatedPatient) : "";
    relatedBranch ? (query["relatedBranch"] = relatedBranch) : "";
    relatedBank ? (query["relatedBank"] = relatedBank) : "";

    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, "i"))
      : "";
    regexKeyword ? (query["name"] = regexKeyword) : "";

    let result = await Repayment.find(query)
      .populate({
        path: "relatedTreatmentVoucher",
        model: "TreatmentVouchers",
      })
      .populate(
        "relatedDebt relatedBank relatedCash relatedBranch relatedPatient"
      );

    // const treatmentVoucher = result.map((item) => item.relatedTreatmentVoucher);
    // console.log(treatmentVoucher);

    count = await Repayment.find(query).count();
    const division = count / limit;
    page = Math.ceil(division);

    res.status(200).send({
      success: true,
      count: count,
      _metadata: {
        current_page: skip / limit + 1,
        per_page: limit,
        page_count: page,
        total_count: count,
      },
      list: result,
    });
  } catch (e) {
    return res.status(500).send({ error: true, message: e.message });
  }
};

exports.getRepayment = async (req, res) => {
  const result = await Repayment.find({
    _id: req.params.id,
    isDeleted: false,
  }).populate(
    "relatedTreatmentVoucher relatedDebt relatedBank relatedCash relatedBranch"
  );
  if (!result)
    return res.status(500).json({ error: true, message: "No Record Found" });
  return res.status(200).send({ success: true, data: result });
};

exports.createRepayment = async (req, res, next) => {
  try {
    let {
      relatedBranch,
      relatedCash,
      relatedBank,
      secondRepayAmount,
      firstRepayAmount,
      relatedPatient,
      patientName,
      description,
    } = req.body;

    const checkResultDoc = await Repayment.findOne({
      relatedBranch: relatedBranch,
      relatedCash: relatedCash,
      relatedBank: relatedBank,
      relatedPatient: relatedPatient,
      patientName: patientName,
    });

    if (checkResultDoc) {
      return res.status(400).send({ error: true, message: "Record Exist" });
    }

    let seperateBankAmount = 0;
    let seperateCashAmount = 0;
    let repaymentTotalAmount = 0;

    // Add to seperateCashAmount and repaymentTotalAmount if relatedCash exists
    if (relatedCash) {
      if (firstRepayAmount) {
        seperateCashAmount += firstRepayAmount;
        repaymentTotalAmount += firstRepayAmount;
      }
      if (secondRepayAmount) {
        seperateCashAmount += secondRepayAmount;
        repaymentTotalAmount += secondRepayAmount;
      }
    }

    // Add to seperateBankAmount and repaymentTotalAmount if relatedBank exists
    if (relatedBank) {
      if (firstRepayAmount) {
        seperateBankAmount += firstRepayAmount;
        repaymentTotalAmount += firstRepayAmount;
      }
      if (secondRepayAmount) {
        seperateBankAmount += secondRepayAmount;
        repaymentTotalAmount += secondRepayAmount;
      }
    }

    // Avoid assigning the same balance to both cash and bank
    if (relatedCash && relatedBank) {
      seperateBankAmount = firstRepayAmount;
      seperateCashAmount = secondRepayAmount;
      repaymentTotalAmount = seperateCashAmount + seperateBankAmount;
    }

    const result = await Repayment.create({
      relatedBranch: relatedBranch,
      relatedCash: relatedCash,
      relatedBank: relatedBank,
      secondRepayAmount: secondRepayAmount,
      firstRepayAmount: firstRepayAmount,
      repaymentAmount: repaymentTotalAmount,
      SeperateCashAmount: seperateCashAmount,
      SeperateBankAmount: seperateBankAmount,
      description: description,
    });

    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.updateRepayment = async (req, res, next) => {
  try {
    const result = await Repayment.findOne({ _id: req.body.id }).populate(
      "relatedTreatmentVoucher relatedDebt relatedBank relatedCash relatedBranch relatedPatient"
    );

    if (result && result.relatedPatient) {
      result.relatedPatient.name = req.body.patientName;
      result.relatedPatient.patientID = req.body.patientID;

      await result.relatedPatient.save();
    }

    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.deleteRepayment = async (req, res, next) => {
  try {
    const today = new Date();
    const deleteDay = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
      today.getHours(),
      today.getMinutes(),
      today.getSeconds()
    );
    const result = await Repayment.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true, expireAt: deleteDay },
      { new: true }
    );
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.activateRepayment = async (req, res, next) => {
  try {
    const result = await Repayment.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: false },
      { new: true }
    );
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.getRepayRecord = async (req, res) => {
  try {
    const result = await RepayRecord.find({
      relatedTreatmentSelection: req.params.id,
    })
      .populate("relatedAppointment relatedBranch")
      .populate({
        path: "relatedTreatmentSelection",
        model: "TreatmentSelections",
        populate: {
          path: "relatedTreatment",
          model: "Treatments",
        },
      });
    if (result.length === 0)
      return res
        .status(404)
        .send({ error: true, message: "No Records Found!" });
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};
