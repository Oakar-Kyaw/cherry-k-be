"use strict";
const Debt = require("../models/debt");
const TreatmentVoucher = require("../models/treatmentVoucher");
const TreatmentSelection = require("../models/treatmentSelection");
const AccountingList = require("../models/accountingList");
const Transaction = require("../models/transaction");
const Repayment = require("../models/repayment");

exports.listAllDebts = async (req, res) => {
  try {
    const { isPaid, relatedBranch } = req.query;
    let query = { isDeleted: false };
    if (isPaid) query.isPaid = isPaid;
    relatedBranch ? (query["relatedBranch"] = relatedBranch) : "";
    let result = await Debt.find(query)
      .populate({
        path: "relatedBank",
        populate: [
          {
            path: "relatedType",
          },
          {
            path: "relatedHeader",
          },
        ],
      })
      .populate({
        path: "relatedCash",
        populate: [
          {
            path: "relatedType",
          },
          {
            path: "relatedHeader",
          },
        ],
      });
    let count = await Debt.find(query).count();
    res.status(200).send({
      success: true,
      count: count,
      data: result,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: "No Record Found!" });
  }
};

exports.getDebt = async (req, res) => {
  let { relatedPatient, relatedBranch, startDate, endDate } = req.query;
  let query = { isDeleted: false };
  relatedPatient ? (query.relatedPatient = relatedPatient) : "";
  let relatedBranchFilterResult;
  startDate && endDate
    ? (query["date"] = { $gte: new Date(startDate), $lte: new Date(endDate) })
    : startDate && !endDate
    ? (query["date"] = { $gte: new Date(startDate) })
    : endDate && !startDate
    ? (query["date"] = { $lte: new Date(endDate) })
    : "";
  const results = await Debt.find(query)
    .populate(
      "knasRelatedTreatmentVoucher relatedTreatmentVoucher relatedMedicineSale"
    )
    .populate({
      path: "relatedBank",
      populate: [
        {
          path: "relatedType",
        },
        {
          path: "relatedHeader",
        },
      ],
    })
    .populate({
      path: "relatedCash",
      populate: [
        {
          path: "relatedType",
        },
        {
          path: "relatedHeader",
        },
      ],
    })
    .populate({
      path: "relatedPatient",
      populate: {
        path: "relatedBranch",
      },
    })
    .populate({
      path: "relatedRepay",
      populate: [
        {
          path: "relatedBank",
        },
        {
          path: "relatedCash",
        },
      ],
    });
  // Filter out the relatedPatient if it doesn't match the relatedBranch
  relatedBranch
    ? (relatedBranchFilterResult = results.filter(
        (result) =>
          result.relatedPatient &&
          result.relatedPatient.relatedBranch.name === relatedBranch
      ))
    : (relatedBranchFilterResult = results);
  if (!results)
    return res.status(500).json({ error: true, message: "No Record Found" });
  return res
    .status(200)
    .send({ success: true, data: relatedBranchFilterResult });
  // return res.status(200).send({ success: true, data: result });
};

exports.createDebt = async (req, res, next) => {
  try {
    const newDebt = new Debt(req.body);
    const result = await newDebt.save();
    res.status(200).send({
      message: "Debt create success",
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.updateDebt = async (req, res, next) => {
  try {
    const {
      relatedTreatmentVoucher,
      relatedBank,
      relatedCash,
      paidAmount,
      relatedBranch,
      date,
      remark,
      treatmentSelections,
    } = req.body;
    if (relatedBank) {
      const transaction = await Transaction.create({
        amount: paidAmount,
        date: date,
        remark: remark,
        type: "Debit",
        relatedBank: relatedBank,
        relatedCash: relatedCash,
        relatedBranch: relatedBranch,
      });
      const update = await AccountingList.findOneAndUpdate(
        { _id: relatedBank },
        { amount: paidAmount },
        { new: true }
      );
    }
    if (relatedCash) {
      const transaction = await Transaction.create({
        amount: paidAmount,
        date: date,
        remark: remark,
        type: "Debit",
        relatedBank: relatedBank,
        relatedCash: relatedCash,
        relatedBranch: relatedBranch,
      });
      const update = await AccountingList.findOneAndUpdate(
        { _id: relatedCash },
        { amount: paidAmount },
        { new: true }
      );
    }
    const fDebt = await Transaction.create({
      amount: req.body.paidAmount,
      relatedAccounting: "6505692e8a572e8de464c0ea", //Account Receivable from Customer
      type: "Credit",
      relatedBranch: relatedBranch,
      date: date,
    });
    const updateDebt = await AccountingList.findOneAndUpdate(
      { _id: "6505692e8a572e8de464c0ea" },
      { $inc: { amount: -paidAmount } },
      { new: true }
    );
    const result = await Debt.findOneAndUpdate({ _id: req.body.id }, req.body, {
      new: true,
    });

    //update treatment selection's payment method using treatment voucher id (Author : Oakar Kyaw)
    if (treatmentSelections && treatmentSelections.length != 0) {
      treatmentSelections.forEach(async (id) => {
        const updateTreatmentSelectionDebt =
          await TreatmentSelection.findByIdAndUpdate(
            id,
            { paymentMethod: "paid" },
            { new: true }
          );
      });
    }
    const update = await TreatmentVoucher.findOneAndUpdate(
      { _id: relatedTreatmentVoucher },
      { paymentMethod: "Paid" },
      { new: true }
    );
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.deleteDebt = async (req, res, next) => {
  try {
    const result = await Debt.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true },
      { new: true }
    );
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.activateDebt = async (req, res, next) => {
  try {
    const result = await Debt.findOneAndUpdate(
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

exports.payTheDebts = async (req, res) => {
  try {
    let {
      balance,
      date,
      relatedTreatmentVoucher,
      relatedBranch,
      description,
      relatedCash,
      secondRelatedCash,
      relatedBank,
      secondRelatedBank,
      relatedPatient,
      repaymentType,
      firstRepayAmount,
      secondRepayAmount,
    } = req.body;

    let findDebt = await Debt.findById(req.params.id);

    if (findDebt.isPaid === true) {
      return res.status(500).send({
        error: true,
        message: "You have already paid Debts",
      });
    }

    let subtractDebt = findDebt.balance - balance;

    if (subtractDebt < 0) {
      return res.status(500).send({
        error: true,
        message: "You can't pay more than the debt amount",
      });
    }

    let repaymentTotalAmount = 0;
    let seperateBankAmount = 0;
    let seperateCashAmount = 0;
    let secondSeperateBankAmount = 0;

    if (repaymentType === "full") {
      repaymentTotalAmount = parseInt(balance);

      if (firstRepayAmount) {
        if (relatedCash) {
          seperateCashAmount += firstRepayAmount;
        }

        if (relatedBank) {
          seperateBankAmount += firstRepayAmount;
        }
      }
    }

    if (repaymentType === "separate") {
      if (
        (firstRepayAmount && relatedBank) ||
        (firstRepayAmount && secondRelatedBank)
      ) {
        seperateBankAmount += firstRepayAmount;
      }

      if (
        (firstRepayAmount && relatedCash) ||
        (firstRepayAmount && secondRelatedCash)
      ) {
        if (relatedCash || secondRelatedCash) {
          seperateCashAmount += firstRepayAmount;
        }
      }

      if (
        (secondRepayAmount && relatedBank) ||
        (secondRepayAmount && secondRelatedBank)
      ) {
        if (relatedBank) {
          secondSeperateBankAmount += secondRepayAmount;
        }
      }

      if (
        (secondRepayAmount && relatedCash) ||
        (secondRepayAmount && secondRelatedCash)
      ) {
        if (relatedCash || secondRelatedCash) {
          seperateCashAmount += secondRepayAmount;
        }
      }

      repaymentTotalAmount = firstRepayAmount + secondRepayAmount;
    }

    let data = {
      repaymentDate: date,
      repaymentAmount: balance,
      remaningCredit: subtractDebt,
      description: description || null,
      relatedDebt: req.params.id,
      relatedTreatmentVoucher: relatedTreatmentVoucher,
      relatedBranch: relatedBranch,
      relatedBank: relatedBank || null,
      secondRelatedBank: secondRelatedBank || null,
      relatedCash: relatedCash || null,
      secondRelatedCash: secondRelatedCash || null,
      relatedPatient: relatedPatient,
      repaymentType: repaymentType,
      secondRepayAmount: secondRepayAmount,
      firstRepayAmount: firstRepayAmount,
      SeperateCashAmount: seperateCashAmount,
      SeperateBankAmount: seperateBankAmount,
      SecondSeperateBankAmount: secondSeperateBankAmount,
    };

    let repay = await Repayment.create(data);

    await TreatmentVoucher.findByIdAndUpdate(relatedTreatmentVoucher, {
      $inc: { balance: -balance },
      $push: { relatedRepay: repay._id },
    });

    await Debt.findByIdAndUpdate(req.params.id, {
      $inc: { balance: -balance },
      $push: { relatedRepay: repay._id },
    });

    if (subtractDebt === 0) {
      await Debt.findByIdAndUpdate(req.params.id, {
        isPaid: true,
        $inc: { balance: -balance },
        $push: { relatedRepay: repay._id },
      });
    }

    res.status(200).send({
      success: true,
      message: "Repayment created",
    });
  } catch (error) {
    res.status(500).send({
      error: true,
      message: error.message,
    });
  }
};
