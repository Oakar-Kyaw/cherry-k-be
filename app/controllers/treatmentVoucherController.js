"use strict";
const TreatmentVoucher = require("../models/treatmentVoucher");
const Transaction = require("../models/transaction");
const Accounting = require("../models/accountingList");
const Patient = require("../models/patient");
const Repay = require("../models/repayment");
const moment = require("moment-timezone");
const Stock = require("../models/stock");
const Log = require("../models/log");
const Debt = require("../models/debt");
const accountingList = require("../models/accountingList");
const TreatmentSelection = require("../models/treatmentSelection");
const Appointment = require("../models/appointment");
const { totalRepayFunction } = require("../lib/repayTotalFunction");
const cacheHelper = require("../helper/cacheHelper");
const repayment = require("../models/repayment");
const { ObjectId } = require("mongodb");
const {
  checkDuplicateVoucher,
} = require("../helper/checkDuplicateVoucherHelper");
const treatmentVoucher = require("../models/treatmentVoucher");
const KmaxVoucher = require("../models/kmaxVoucher");
const MedicineItemsModel = require("../models/medicineItem");
const MedicineItemsRecordModel = require("../models/medicineItemRecord");
const MedicineSalesModel = require("../models/medicineSale");
const mongoose = require("mongoose");

exports.combineMedicineSale = async (req, res) => {
  let data = req.body;
  let {
    treatmentSelectId,
    remark,
    relatedBank,
    relatedCash,
    msPaidAmount,
    bankType,
    medicineItems,
    id,
    relatedPatient,
  } = req.body;
  let createdBy = req.credentials.id;
  let objID = "";
  console.log("1 ", data);
  //search combineSaleActive is true or false
  let queryCombineSaleActive = await TreatmentSelection.findById(
    treatmentSelectId
  );

  //update combine sale active to true
  await TreatmentSelection.findByIdAndUpdate(treatmentSelectId, {
    combineSaleActive: true,
  });
  // if(queryCombineSaleActive.combineSaleActive && queryCombineSaleActive.combineSaleActive == false)
  //   await TreatmentSelection.findByIdAndUpdate(
  //          treatmentSelectId,
  //          {combineSaleActive:true}
  //         )

  const patientUpdate = await Patient.findOneAndUpdate(
    { _id: relatedPatient },
    {
      $inc: {
        conditionAmount: msPaidAmount || 0,
        conditionPurchaseFreq: 1,
        conditionPackageQty: 1,
      },
    },
    { new: true }
  );
  if (medicineItems !== undefined) {
    for (const e of medicineItems) {
      if (e.stock < e.qty)
        return res.status(500).send({
          error: true,
          message: "RequestedQty Cannot Be Greater Than StockQty!",
        });
      let totalUnit = e.stock - e.qty;
      const result = await Stock.find({
        relatedMedicineItems: e.item_id,
        relatedBranch: req.body.relatedBranch,
      });
      if (result.length <= 0)
        return res
          .status(500)
          .send({ error: true, message: "Medicine Item Not Found!" });
      const from = result[0].fromUnit;
      const to = result[0].toUnit;
      const currentQty = (from * totalUnit) / to;
      try {
        const result = await Stock.findOneAndUpdate(
          {
            relatedMedicineItems: e.item_id,
            relatedBranch: req.body.relatedBranch,
          },
          { totalUnit: totalUnit, currentQty: currentQty },
          { new: true }
        );
      } catch (error) {
        return res.status(500).send({ error: true, message: error.message });
      }
      const logResult = await Log.create({
        relatedTreatmentSelection: null,
        relatedAppointment: null,
        relatedMedicineItems: e.item_id,
        currentQty: e.stock,
        actualQty: e.actual,
        finalQty: totalUnit,
        type: "Medicine Sale",
        relatedBranch: req.body.relatedBranch,
        createdBy: createdBy,
      });
    }
  }
  if (req.body.secondAmount) {
    var fTransResult = await Transaction.create({
      amount: req.body.secondAmount,
      relatedBranch: req.body.relatedBranch,
      date: Date.now(),
      remark: remark || " ",
      relatedAccounting: req.body.secondAccount,
      type: "Credit",
      createdBy: createdBy,
      relatedBranch: req.mongoQuery.relatedBranch,
    });
    const amountUpdates = await Accounting.findOneAndUpdate(
      { _id: req.body.secondAccount },
      { $inc: { amount: req.body.secondAmount } }
    );
  }
  //_________COGS___________
  // const medicineResult = await MedicineItems.find({ _id: { $in: medicineItems.map(item => item.item_id) } })
  // const purchaseTotal = medicineResult.reduce((accumulator, currentValue) => accumulator + currentValue.purchasePrice, 0)

  // const inventoryResult = Transaction.create({
  //     "amount": purchaseTotal,
  //     "date": Date.now(),
  //     "remark": remark,
  //     "relatedAccounting": "64a8e06755a87deaea39e17b", //Medicine inventory
  //     "type": "Credit",
  //     "createdBy": createdBy
  // })
  // var inventoryAmountUpdate = await Accounting.findOneAndUpdate(
  //     { _id: "64a8e06755a87deaea39e17b" },  // Medicine inventory
  //     { $inc: { amount: -purchaseTotal } }
  // )
  // const COGSResult = Transaction.create({
  //     "amount": purchaseTotal,
  //     "date": Date.now(),
  //     "remark": remark,
  //     "relatedAccounting": "64a8e10b55a87deaea39e193", //Medicine Sales COGS
  //     "type": "Debit",
  //     "relatedTransaction": inventoryResult._id,
  //     "createdBy": createdBy
  // })
  // var inventoryUpdate = await Transaction.findOneAndUpdate(
  //     { _id: inventoryResult._id },
  //     {
  //         relatedTransaction: COGSResult._id
  //     },
  //     { new: true }
  // )
  // var COGSUpdate = await Accounting.findOneAndUpdate(
  //     { _id: "64a8e10b55a87deaea39e193" },  //Medicine Sales COGS
  //     { $inc: { amount: purchaseTotal } }
  // )
  //_________END_OF_COGS___________

  //..........Transaction.............................
  // const fTransaction = new Transaction({
  //     "amount": data.msPaidAmount,
  //     "date": Date.now(),
  //     "remark": remark,
  //     "relatedAccounting": "648095b57d7e4357442aa457", //Sales Medicines
  //     "type": "Credit",
  //     "createdBy": createdBy
  // })
  // const fTransResult = await fTransaction.save()
  // var amountUpdate = await Accounting.findOneAndUpdate(
  //     { _id: "648095b57d7e4357442aa457" },  //Sales Medicines
  //     { $inc: { amount: data.msPaidAmount } }
  // )
  // //sec transaction
  // const secTransaction = new Transaction(
  //     {
  //         "amount": data.msPaidAmount,
  //         "date": Date.now(),
  //         "remark": remark,
  //         "relatedBank": relatedBank,
  //         "relatedCash": relatedCash,
  //         "type": "Debit",
  //         "relatedTransaction": fTransResult._id,
  //         "createdBy": createdBy
  //     }
  // )
  // const secTransResult = await secTransaction.save();
  // var fTransUpdate = await Transaction.findOneAndUpdate(
  //     { _id: fTransResult._id },
  //     {
  //         relatedTransaction: secTransResult._id
  //     },
  //     { new: true }
  // )
  // if (relatedBank) {
  //     var amountUpdate = await Accounting.findOneAndUpdate(
  //         { _id: relatedBank },
  //         { $inc: { amount: data.msPaidAmount } }
  //     )
  // } else if (relatedCash) {
  //     var amountUpdate = await Accounting.findOneAndUpdate(
  //         { _id: relatedCash },
  //         { $inc: { amount: data.msPaidAmount } }
  //     )
  // }
  // let objID = ''
  // if (relatedBank) objID = relatedBank
  // if (relatedCash) objID = relatedCash
  // //transaction
  // const acc = await Accounting.find({ _id: objID })
  // if (acc.length > 0) {
  //     const accResult = await Accounting.findOneAndUpdate(
  //         { _id: objID },
  //         { amount: parseInt(msPaidAmount) + parseInt(acc[0].amount) },
  //         { new: true },
  //     )
  // }
  // data = { ...data, relatedTransaction: [fTransResult._id, secTransResult._id], createdBy: createdBy, purchaseTotal: purchaseTotal }
  // if (purchaseTotal) data.purchaseTotal = purchaseTotal
  //..........END OF TRANSACTION.....................

  const medicineSaleResult = await TreatmentVoucher.findOneAndUpdate(
    { _id: id },
    data,
    { new: true }
  );
  if (req.body.balance > 0) {
    const debtCreate = await Debt.create({
      balance: req.body.balance,
      relatedPatient: data.relatedPatient,
      relatedTreatmentVoucher: medicineSaleResult._id,
    });
  }

  // const fAmtTransaction = new Transaction({
  //     "amount": msPaidAmount || 0,
  //     "date": Date.now(),
  //     "remark": remark || "",
  //     "relatedAccounting": "646739c059a9bc811d97fa8b", //Sales (Medicines),
  //     "relatedMedicineSale": medicineSaleResult._id,
  //     "type": "Credit",
  //     "createdBy": createdBy
  // })
  // console.log("fa ", fAmtTransaction)
  // const fsecAmtTransResult = await fAmtTransaction.save()
  var amountUpdate = await Accounting.findOneAndUpdate(
    { _id: "646739c059a9bc811d97fa8b" },
    { $inc: { amount: req.body.msPaidAmount } }
  );
  //sec transaction
  const secAmtTransaction = new Transaction({
    amount: req.body.msPaidAmount,
    date: Date.now(),
    remark: remark || " ",
    relatedBank: req.body.relatedBank,
    relatedCash: req.body.relatedCash,
    type: "Debit",
    // "relatedTransaction": fTransResult._id,
    createdBy: createdBy,
  });
  const secAmtTransResult = await secAmtTransaction.save();
  // var fTransUpdate = await Transaction.findOneAndUpdate(
  //     { _id: fTransResult._id },
  //     {
  //         relatedTransaction: secTransResult._id
  //     },
  //     { new: true }
  // )
  if (req.body.relatedBank) {
    // //treatment voucher update
    // let updateTreatmentVoucher = await TreatmentVoucher.findOneAndUpdate(
    //     { relatedBank: relatedBank },{$inc: {totalAmount: msPaidAmount}},{new:true})
    // console.log("update tr ", updateTreatmentVoucher)
    var amountUpdate = await Accounting.findOneAndUpdate(
      { _id: req.body.relatedBank },
      { $inc: { amount: req.body.msPaidAmount } }
    );
  } else if (req.body.relatedCash) {
    var amountUpdate = await Accounting.findOneAndUpdate(
      { _id: req.body.relatedCash },
      { $inc: { amount: req.body.msPaidAmount } }
    );
  }

  res.status(200).send({
    message: "MedicineSale Combination success",
    success: true,
    data: medicineSaleResult,
  });
};

exports.createSingleMedicineSale = async (req, res) => {
  try {
    //clear cache of voucher list
    cacheHelper.clearAll();
    let data = req.body;
    let objID = "";
    let {
      remark,
      relatedBank,
      relatedCash,
      medicineItems,
      relatedBranch,
      tsType,
      msTotalAmount,
      relatedPatient,
      createdAt,
    } = req.body;
    let createdBy = req.credentials.id;
    // console.log("this medi")
    // let checkDuplicate = await checkDuplicateVoucher({ tsType: tsType, msTotalAmount: msTotalAmount, relatedPatient: relatedPatient, createdAt: createdAt, relatedBranch: relatedBranch, medicineItems: medicineItems } )
    // console.log("d")
    // if(checkDuplicate) return res.status(403).send({success: false, message: "Duplicate Vouchers"})
    let day = new Date().toISOString();
    let today = day.split("T");
    const latestDocument = await TreatmentVoucher.find({
      isDeleted: false,
      tsType: "MS",
      Refund: false,
      relatedBranch: relatedBranch,
    })
      .sort({ _id: -1 })
      .limit(1)
      .exec();
    if (latestDocument.length === 0) {
      req.body["code"] = "MVC-" + today[0].replace(/-/g, "") + "-1"; // if seq is undefined set initial patientID and seq
      req.body["seq"] = 1;
    }
    if (latestDocument.length > 0 && latestDocument[0].seq) {
      const increment = latestDocument[0].seq + 1;
      req.body["code"] = "MVC-" + today[0].replace(/-/g, "") + "-" + increment; // if seq is undefined set initial patientID and seq
      req.body["seq"] = increment;
    }
    if (medicineItems !== undefined) {
      for (const e of medicineItems) {
        console.log("medicine is ", e);
        const result = await Stock.findOne({
          relatedMedicineItems: e.item_id,
          relatedBranch: req.body.relatedBranch,
        }).populate("relatedMedicineItems");
        if (!result)
          return res
            .status(500)
            .send({ success: false, message: "Medicine Item Not Found!" });
        if (Number(result.totalUnit) < Number(e.qty))
          return res.status(500).send({
            success: false,
            message: "RequestedQty Cannot Be Greater Than StockQty!",
          });
        console.log("reusl", result);
        let totalUnit = Number(result.totalUnit) - Number(e.qty);
        const from = Number(result.fromUnit);
        const to = Number(result.toUnit);
        console.log("to is ", to);
        const currentQty = (from * totalUnit) / to;
        console.log(totalUnit, currentQty);
        try {
          const result = await Stock.findOneAndUpdate(
            { relatedMedicineItems: e.item_id, relatedBranch: relatedBranch },
            { totalUnit: totalUnit, currentQty: currentQty },
            { new: true }
          );
        } catch (error) {
          return res.status(500).send({ error: true, message: error.message });
        }
        const logResult = await Log.create({
          relatedTreatmentSelection: null,
          relatedAppointment: null,
          relatedMedicineItems: e.item_id,
          currentQty: result.totalUnit,
          actualQty: e.qty,
          finalQty: totalUnit,
          type: "Medicine Sale",
          relatedBranch: req.body.relatedBranch,
          createdBy: createdBy,
        });
      }
    }
    if (req.body.secondAmount) {
      var fAmtTransResult = await Transaction.create({
        amount: req.body.secondAmount,
        relatedBranch: req.body.relatedBranch,
        date: Date.now(),
        remark: remark || " ",
        relatedAccounting: req.body.secondAccount,
        type: "Credit",
        createdBy: createdBy,
        relatedBranch: req.mongoQuery.relatedBranch,
      });
      const amountUpdates = await Accounting.findOneAndUpdate(
        { _id: req.body.secondAccount },
        { $inc: { amount: req.body.secondAmount } }
      );
    }
    const medicineSaleResult = await TreatmentVoucher.create(data);
    console.log(medicineSaleResult._id);
    //Transaction
    const fTransaction = new Transaction({
      amount: data.payAmount,
      date: Date.now(),
      remark: remark || " ",
      relatedAccounting: "646739c059a9bc811d97fa8b", //Sales (Medicines),
      relatedMedicineSale: medicineSaleResult._id,
      type: "Credit",
      createdBy: createdBy,
    });
    const fTransResult = await fTransaction.save();

    var amountUpdate = await Accounting.findOneAndUpdate(
      { _id: "646739c059a9bc811d97fa8b" },
      { $inc: { amount: data.msPaidAmount } }
    );
    console.log("here");
    //sec transaction
    const secTransaction = new Transaction({
      amount: data.msPaidAmount,
      date: Date.now(),
      remark: remark || " ",
      relatedBank: req.body.relatedBank,
      relatedCash: req.body.relatedCash,
      type: "Debit",
      relatedTransaction: fTransResult._id,
      createdBy: createdBy,
    });
    const secTransResult = await secTransaction.save();

    var fTransUpdate = await Transaction.findOneAndUpdate(
      { _id: fTransResult._id },
      {
        relatedTransaction: secTransResult._id,
      },
      { new: true }
    );

    if (req.body.relatedBank) {
      var amountUpdate = await Accounting.findOneAndUpdate(
        { _id: req.body.relatedBank },
        { $inc: { amount: data.msPaidAmount } }
      );
    } else if (req.body.relatedCash) {
      var amountUpdate = await Accounting.findOneAndUpdate(
        { _id: req.body.relatedCash },
        { $inc: { amount: data.msPaidAmount } }
      );
    }

    if (req.body.relatedBank) objID = req.body.relatedBank;
    if (req.body.relatedCash) objID = req.body.relatedCash;
    //transaction

    const acc = await Accounting.find({ _id: objID });

    const accResult = await Accounting.findOneAndUpdate(
      { _id: objID },
      { amount: parseInt(req.body.msPaidAmount) + parseInt(acc[0].amount) },
      { new: true }
    );

    const updateMedSale = await TreatmentVoucher.findOneAndUpdate(
      { _id: medicineSaleResult._id },
      {
        relatedTransaction: [fTransResult._id, secTransResult._id],
        createdBy: createdBy,
        relatedBranch: req.body.relatedBranch,
      },
      { new: true }
    );
    if (req.body.balance > 0) {
      const debtCreate = await Debt.create({
        balance: req.body.balance,
        relatedPatient: data.relatedPatient,
        relatedTreatmentVoucher: medicineSaleResult._id,
      });
      const fTransaction = new Transaction({
        amount: req.body.balance,
        date: Date.now(),
        remark: remark || " ",
        relatedAccounting: "6505692e8a572e8de464c0ea", //Account Receivable from Customer
        type: "Debit",
        createdBy: createdBy,
      });
      const fTransResult = await fTransaction.save();
      var amountUpdate = await Accounting.findOneAndUpdate(
        { _id: "6505692e8a572e8de464c0ea" }, //Account Receivable from Customer
        { $inc: { amount: req.body.balance } }
      );

      const secTransaction = new Transaction({
        amount: data.msPaidAmount,
        date: Date.now(),
        remark: remark || " ",
        relatedBank: relatedBank,
        relatedCash: relatedCash,
        type: "Debit",
        relatedTransaction: fTransResult._id,
        createdBy: createdBy,
      });
      const secTransResult = await secTransaction.save();
      var fTransUpdate = await Transaction.findOneAndUpdate(
        { _id: fTransResult._id },
        {
          relatedTransaction: secTransResult._id,
        },
        { new: true }
      );
      if (relatedBank) {
        var amountUpdate = await Accounting.findOneAndUpdate(
          { _id: relatedBank },
          { $inc: { amount: req.body.msPaidAmount } }
        );
      } else if (relatedCash) {
        var amountUpdate = await Accounting.findOneAndUpdate(
          { _id: relatedCash },
          { $inc: { amount: req.body.msPaidAmount } }
        );
      }
    }
    return res.status(200).send({
      message: "MedicineSale Transaction success",
      success: true,
      data: updateMedSale,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      error: true,
      message: error.message,
    });
  }
};

exports.getCodeMS = async (req, res) => {
  let data = {};
  try {
    let today = new Date().toISOString();
    const latestDocument = await TreatmentVoucher.find(
      { tsType: "MS" },
      { seq: 1 }
    )
      .sort({ _id: -1 })
      .limit(1)
      .exec();
    if (latestDocument.length === 0)
      data = {
        ...data,
        seq: 1,
        code: "MVC-" + today.split("T")[0].replace(/-/g, "") + "-1",
      }; // if seq is undefined set initial patientID and seq
    if (latestDocument.length > 0) {
      const increment = (latestDocument[0].seq || 0) + 1;

      data = {
        ...data,
        code: "MVC-" + today.split("T")[0].replace(/-/g, "") + "-" + increment,
        seq: increment,
      };
    }
    return res.status(200).send({ success: true, data: data });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.listAllTreatmentVouchers = async (req, res) => {
  let { keyword, role, limit, skip } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 20; //limit
    skip = +skip || 0;
    let query = req.mongoQuery,
      regexKeyword;
    role ? (query["role"] = role.toUpperCase()) : "";
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, "i"))
      : "";
    regexKeyword ? (query["name"] = regexKeyword) : "";
    let result = await TreatmentVoucher.find(query)
      .populate(
        "createdBy relatedTreatment relatedAppointment relatedPatient payment relatedTreatmentSelection relatedBranch relatedRepay"
      )
      .populate({
        path: "relatedTreatmentPackage",
        populate: {
          path: "item_id",
        },
      });
    count = await TreatmentVoucher.find(query).count();
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

exports.getTreatmentVoucherWithTreatmentID = async (req, res) => {
  let query = req.mongoQuery;
  if (req.params.id) query.relatedTreatmentSelection = req.params.id;
  const result = await TreatmentVoucher.find(query)
    .populate(
      "createdBy relatedTreatment relatedAppointment relatedPatient relatedRepay"
    )
    .populate({
      path: "relatedTreatmentPackage",
      populate: {
        path: "item_id",
      },
    });
  if (!result)
    return res.status(500).json({ error: true, message: "No Record Found" });
  return res.status(200).send({ success: true, data: result });
};

exports.getTreatmentVoucher = async (req, res) => {
  let query = req.mongoQuery;
  if (req.params.id) query._id = req.params.id;
  const result = await TreatmentVoucher.find(query)
    .populate(
      "createdBy relatedTreatment relatedAppointment relatedPatient relatedTreatmentSelection medicineItems.item_id multiTreatment.item_id relatedDentalTreatmentSelection relatedPackage relatedPackageSelection relatedRepay"
    )
    .populate({
      path: "multiDentalTreatment",
      populate: {
        path: "item_id",
      },
    })
    .populate({
      path: "relatedTreatmentPackage",
      populate: {
        path: "item_id",
      },
    })
    .populate({
      path: "relatedTreatmentPackageSelection",
      populate: [
        {
          path: "relatedTreatmentSelection",
        },
        {
          path: "relatedTreatmentPackage",
        },
      ],
    });
  if (!result)
    return res.status(500).json({ error: true, message: "No Record Found" });
  return res.status(200).send({ success: true, data: result });
};

exports.getRelatedTreatmentVoucher = async (req, res) => {
  try {
    let query = req.mongoQuery;
    let {
      relatedPatient,
      relatedTreatment,
      start,
      end,
      treatmentSelection,
      createdBy,
      relatedBranch,
    } = req.body;
    if (start && end) query.createdAt = { $gte: start, $lte: end };
    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (relatedTreatment) query.relatedTreatment = relatedTreatment;
    if (treatmentSelection)
      query.relatedTreatmentSelection = treatmentSelection;
    if (createdBy) query.createdBy = createdBy;
    if (relatedBranch) query.relatedBranch = relatedBranch;
    const result = await TreatmentVoucher.find(query)
      .populate(
        "createdBy relatedTreatment relatedAppointment relatedPatient relatedTreatmentSelection  relatedRepay"
      )
      .populate({
        path: "relatedTreatmentPackage",
        populate: {
          path: "item_id",
        },
      });
    if (!result)
      return res.status(404).json({ error: true, message: "No Record Found" });
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({
      error: true,
      message: "An Error Occured While Fetching Related Treatment Vouchers",
    });
  }
};

exports.searchTreatmentVoucher = async (req, res, next) => {
  try {
    let query = req.mongoQuery;
    let { search, relatedPatient } = req.body;
    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (search) query.$text = { $search: search };
    const result = await TreatmentVoucher.find(query)
      .populate(
        "createdBy relatedTreatment relatedAppointment relatedPatient relatedTreatmentSelection relatedRepay"
      )
      .populate({
        path: "relatedTreatmentPackage",
        populate: {
          path: "item_id",
        },
      });
    if (result.length === 0)
      return res.status(404).send({ error: true, message: "No Record Found!" });
    return res.status(200).send({ success: true, data: result });
  } catch (err) {
    return res.status(500).send({ error: true, message: err.message });
  }
};

exports.getCode = async (req, res) => {
  let data = {};
  try {
    let today = new Date().toISOString();
    console.log("data is ", today);
    const latestDocument = await TreatmentVoucher.find({}, { seq: 1 })
      .sort({ _id: -1 })
      .limit(1)
      .exec();
    console.log("today split is ", today.split("T")[0].replace(/-/g, ""));
    if (latestDocument.length === 0)
      data = {
        ...data,
        seq: 1,
        code: "TVC-" + today.split("T")[0].replace(/-/g, "") + "-1",
      }; // if seq is undefined set initial patientID and seq
    if (latestDocument.length > 0) {
      const increment = (latestDocument[0].seq || 0) + 1;
      data = {
        ...data,
        code: "TVC-" + today.split("T")[0].replace(/-/g, "") + "-" + increment,
        seq: increment,
      };
    }
    return res.status(200).send({ success: true, data: data });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.createTreatmentVoucher = async (req, res, next) => {
  let data = req.body;
  try {
    const newTreatmentVoucher = new TreatmentVoucher(data);
    const result = await newTreatmentVoucher.save();
    res.status(200).send({
      message: "TreatmentVoucher create success",
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.updateTreatmentVoucher = async (req, res, next) => {
  try {
    const result = await TreatmentVoucher.findOneAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true }
    ).populate("createdBy relatedTreatment relatedAppointment relatedPatient");
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.deleteTreatmentVoucher = async (req, res, next) => {
  try {
    const result = await TreatmentVoucher.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true, status: "Canceled" },
      { new: true }
    );
    const transactionArr = result.relatedTransaction;
    const treatmentSelect = result.relatedTreatmentSelection;
    const appointment = result.relatedAppointment;

    const deletedTransactions = await Transaction.updateMany(
      { _id: { $in: transactionArr }, isDeleted: false }, // Filter
      { $set: { isDeleted: true } } // Update
    );

    if (transactionArr) {
      for (const item of transactionArr) {
        const getItem = await TreatmentVoucher.findOne({ _id: item });
        if (!getItem)
          return res.status(200).send({ success: true, message: "Not Found!" });
        if (getItem.relatedBank) {
          const updateBank = accountingList.findOneAndUpdate(
            { _id: getItem.relatedBank },
            { $inc: { amount: -getItem.amount } },
            { new: true }
          );
        }
        if (getItem.relatedCash) {
          const updateCash = accountingList.findOneAndUpdate(
            { _id: getItem.relatedCash },
            { $inc: { amount: -getItem.amount } },
            { new: true }
          );
        }
        if (getItem.relatedAccounting) {
          const updateCash = accountingList.findOneAndUpdate(
            { _id: getItem.relatedAccounting },
            { $inc: { amount: -getItem.amount } },
            { new: true }
          );
        }
      }
    }

    if (treatmentSelect) {
      for (const item of treatmentSelect) {
        const getItem = await TreatmentSelection.deleteMany({ _id: item });
        console.log(getItem);
        if (!getItem)
          return res.status(200).send({ success: true, message: "Not Found!" });
      }
    }

    //Reserving the quantity for eact item in MedicineSales and Update MedicineItems Stock
    for (const saleItems of result.medicineItems) {
      const medicineItemDoc = await MedicineItemsModel.findById(
        saleItems.item_id
      );

      if (!medicineItemDoc)
        return res
          .status(404)
          .send({ error: true, message: "Medicine Item Not Found!" });

      medicineItemDoc.currentQuantity += saleItems.qty;

      await medicineItemDoc.save();

      const AfterDeleteRecord = new MedicineItemsRecordModel({
        medicineItems: [
          {
            RemovedItem_id: medicineItemDoc.item_id,
            addRemovedQtyBackToMedItems: saleItems.qty,
            MedItemQtyAfterDelete: medicineItemDoc.currentQuantity,
          },
        ],
        relatedBranch: result.relatedBranch,
        reason: "Treatment Voucher Deleted",
      });

      await AfterDeleteRecord.save();
    }

    await MedicineSalesModel.updateMany(
      { isDeleted: false },
      { relatedTreatment: result.relatedTreatment },
      { new: true }
    );

    result.isDeleted = true;
    result.status = "Deleted";
    await result.save();

    if (appointment) {
      const updateResult = await Appointment.deleteMany({ _id: appointment });
    }

    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.activateTreatmentVoucher = async (req, res, next) => {
  try {
    const result = await TreatmentVoucher.findOneAndUpdate(
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

exports.filterTreatmentVoucher = async (req, res, next) => {
  try {
    let query = { isDeleted: false };
    let { startDate, endDate, relatedDoctor, relatedPatient } = req.query;
    if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
    if (relatedDoctor) query.relatedDoctor = relatedDoctor;
    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (Object.keys(query).length === 0)
      return res.status(404).send({
        error: true,
        message: "Please Specify A Query To Use This Function",
      });
    const result = await TreatmentVoucher.find(query)
      .populate(
        "createdBy relatedTreatment relatedAppointment relatedPatient payment relatedTreatmentSelection relatedBranch relatedRepay"
      )
      .populate({
        path: "relatedTreatmentPackage",
        populate: {
          path: "item_id",
        },
      });
    if (result.length === 0)
      return res.status(404).send({ error: true, message: "No Record Found!" });
    res.status(200).send({ success: true, data: result });
  } catch (err) {
    return res.status(500).send({ error: true, message: err.message });
  }
};

exports.getTodaysTreatmentVoucher = async (req, res) => {
  try {
    let query = req.mongoQuery;
    var start = new Date();
    var end = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (start && end) query.originalDate = { $gte: start, $lt: end };
    const result = await TreatmentVoucher.find(query)
      .populate("createdBy relatedAppointment relatedPatient relatedRepay")
      .populate({
        path: "relatedTreatment",
        model: "Treatments",
        populate: {
          path: "treatmentName",
          model: "TreatmentLists",
        },
      })
      .populate({
        path: "relatedTreatmentPackage",
        populate: {
          path: "item_id",
        },
      });
    if (result.length === 0)
      return res.status(404).json({ error: true, message: "No Record Found!" });
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.getwithExactDate = async (req, res) => {
  try {
    let { exact } = req.query;
    const date = new Date(exact);
    const startDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ); // Set start date to the beginning of the day
    const endDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    ); // Set end date to the beginning of the next day
    let result = await TreatmentVoucher.find({
      createdAt: { $gte: startDate, $lt: endDate },
    })
      .populate(
        "createdBy relatedAppointment relatedPatient relatedCash relatedRepay"
      )
      .populate({
        path: "relatedTreatment",
        model: "Treatments",
        populate: {
          path: "treatmentName",
          model: "TreatmentLists",
        },
      })
      .populate({
        path: "relatedTreatmentPackage",
        populate: {
          path: "item_id",
        },
      });
    //.populate('createdBy relatedTreatment relatedAppointment relatedPatient');
    if (result.length <= 0)
      return res.status(404).send({ error: true, message: "Not Found!" });
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.NewTreatmentVoucherFilter = async (req, res) => {
  let response = {
    success: true,
    _metadata: {},
    data: {},
  };

  try {
    const {
      startDate,
      endDate,
      createdBy,
      purchaseType,
      relatedDoctor,
      bankType,
      tsType,
      relatedPatient,
      bankID,
      relatedBranch,
      income,
      page = 1,
      limit = 30,
    } = req.query;

    let query = {
      relatedBank: { $exists: true },
      isDeleted: false,
      relatedBranch: { $exists: true },
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).send({
          error: true,
          message: "Invalid startDate or endDate format.",
        });
      }

      query.createdAt = {
        $gte: start,
        $lte: new Date(end.setHours(23, 59, 59, 999)),
      };
    }

    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (bankType) query.bankType = bankType;
    if (createdBy) query.createdBy = mongoose.Types.ObjectId(createdBy);
    if (bankID) query.relatedBank = bankID;
    if (purchaseType) query.purchaseType = purchaseType;
    if (relatedDoctor) query.relatedDoctor = relatedDoctor;
    if (relatedBranch)
      query.relatedBranch = mongoose.Types.ObjectId(relatedBranch);
    if (tsType) {
      query.tsType = tsType;
    } else {
      query.tsType = { $in: ["TSMulti", "MS"] };
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipIndex = (pageNumber - 1) * limitNumber;

    // Aggregate query for bank payments
    const bankResult = await TreatmentVoucher.aggregate([
      {
        $match: {
          ...query,
          Refund: false,
          paymentType: "Bank",
        },
      },
      {
        $group: {
          _id: null,
          totalPaidAmountSum: { $sum: { $ifNull: ["$totalPaidAmount", 0] } },
          msPaidAmount: { $sum: { $ifNull: ["$msPaidAmount", 0] } },
          psPaidAmount: { $sum: { $ifNull: ["$psPaidAmount", 0] } },
          paidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaidAmountSum: {
            $add: [
              "$totalPaidAmountSum",
              "$msPaidAmount",
              "$psPaidAmount",
              "$paidAmount",
            ],
          },
        },
      },
      {
        $skip: skipIndex,
      },
      {
        $limit: limitNumber,
      },
    ]);

    let secondBankCashAmount = [];
    let firstBankName = [];
    let secondCashName = [];

    // Aggregating and processing the second account and cash amounts
    let allBankResult = await TreatmentVoucher.find(query)
      .populate("secondAccount relatedBank relatedCash relatedRepay") // Add relatedRepay here
      .lean();

    console.log("allBankResult", allBankResult);

    // Iterate over results to extract second account and cash-related data
    const BankNames = allBankResult.reduce(
      (
        result,
        {
          Refund,
          relatedBank,
          paidAmount,
          msPaidAmount,
          totalPaidAmount,
          psPaidAmount,
          secondAccount,
          secondAmount,
        }
      ) => {
        if (
          secondAccount &&
          secondAccount.relatedHeader.name == "Cash In Hand"
        ) {
          let { name } = secondAccount;
          secondCashName.push({ cashname: name, amount: secondAmount });
        } else if (
          secondAccount &&
          secondAccount.relatedHeader.name === "Cash At Bank"
        ) {
          const bankName = secondAccount.name;
          secondBankCashAmount.push({
            bankname: bankName,
            amount: secondAmount,
          });
        }

        if (relatedBank) {
          const { name } = relatedBank;
          result[name] =
            (result[name] || 0) +
            (paidAmount || 0) +
            (msPaidAmount || 0) +
            (totalPaidAmount || 0) +
            (psPaidAmount || 0);
        }
        return result;
      },
      {}
    );

    const BankTotal = allBankResult.reduce(
      (total, sale) =>
        total +
        (sale.paidAmount || 0) +
        (sale.msPaidAmount || 0) +
        (sale.totalPaidAmount || 0) +
        (sale.psPaidAmount || 0),
      0
    );

    let secondBank = secondBankCashAmount.reduce((result, nextresult) => {
      const equalBankName = result.find(
        (t) => t.bankname === nextresult.bankname
      );

      if (equalBankName) {
        equalBankName.amount += nextresult.amount;
      } else {
        result.push({
          bankname: nextresult.bankname,
          amount: nextresult.amount,
        });
      }

      return result;
    }, []);

    if (BankNames) {
      Object.keys(BankNames).forEach((key) =>
        firstBankName.push({ bankname: key, amount: BankNames[key] })
      );
    }

    response.data = {
      ...response.data,
      BankTotal: BankTotal,
      secondBank: secondBank,
      firstBankName: firstBankName,
      BankList: allBankResult,
    };

    // Example to add metadata to the response
    const totalItems = await TreatmentVoucher.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNumber);

    response._metadata = {
      totalItems: totalItems,
      totalPages: totalPages,
      currentPage: pageNumber,
      itemsPerPage: limitNumber,
    };

    return res.status(200).send(response);
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.treatmentFilterWithBankMS = async (req, res) => {
  let response = {
    success: true,
    _metadata: {},
    data: {},
  };

  try {
    const {
      startDate,
      endDate,
      createdBy,
      purchaseType,
      relatedDoctor,
      bankType,
      tsType,
      relatedPatient,
      bankID,
      relatedBranch,
      income,
      page = 1,
      limit = 30,
    } = req.query;

    let query = {
      relatedBank: { $exists: true },
      isDeleted: false,
      relatedBranch: { $exists: true },
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Check if the created Date objects are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).send({
          error: true,
          message: "Invalid startDate or endDate format.",
        });
      }

      // Ensure the end date captures the full day
      query.createdAt = {
        $gte: start,
        $lte: new Date(end.setHours(23, 59, 59, 999)), // End of the day
      };
    }
    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (bankType) query.bankType = bankType;
    if (createdBy) query.createdBy = mongoose.Types.ObjectId(createdBy);
    if (bankID) query.relatedBank = bankID;
    if (purchaseType) query.purchaseType = purchaseType;
    if (relatedDoctor) query.relatedDoctor = relatedDoctor;
    if (relatedBranch) {
      query.relatedBranch = mongoose.Types.ObjectId(relatedBranch);
    }
    if (tsType) {
      query.tsType = tsType;
    } else {
      query.tsType = "MS";
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipIndex = (pageNumber - 1) * limitNumber;

    // Aggregate query for bank payments
    const bankResult = await TreatmentVoucher.aggregate([
      {
        $match: {
          ...query,
          Refund: false,
          paymentType: "Bank",
        },
      },
      {
        $group: {
          _id: null,
          totalPaidAmountSum: { $sum: { $ifNull: ["$totalPaidAmount", 0] } },
          msPaidAmount: { $sum: { $ifNull: ["$msPaidAmount", 0] } },
          psPaidAmount: { $sum: { $ifNull: ["$psPaidAmount", 0] } },
          paidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaidAmountSum: {
            $add: [
              "$totalPaidAmountSum",
              "$msPaidAmount",
              "$psPaidAmount",
              "$paidAmount",
            ],
          },
        },
      },
      {
        $skip: skipIndex,
      },
      {
        $limit: limitNumber,
      },
    ]);

    // Process bankResult and populate as needed
    console.log("Bank Result:", bankResult);

    if (bankResult.length > 0) {
      response.data.bankResult = bankResult[0]; // Assuming you want to set the first result
    } else {
      response.data.bankResult = {
        totalPaidAmountSum: 0,
        bankPaymentSum: 0,
      };
    }

    // Example to add metadata to the response
    const totalItems = await TreatmentVoucher.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNumber);

    response._metadata = {
      totalItems: totalItems,
      totalPages: totalPages,
      currentPage: pageNumber,
      itemsPerPage: limitNumber,
    };

    return res.status(200).send(response);
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.treatmentFilterWithCashMS = async (req, res) => {
  let response = {
    success: true,
    _metadata: {},
    data: {},
  };

  try {
    const {
      startDate,
      endDate,
      createdBy,
      purchaseType,
      relatedDoctor,
      bankType,
      tsType,
      relatedPatient,
      bankID,
      relatedBranch,
      income,
      page = 1,
      limit = 30,
    } = req.query;

    let query = {
      relatedBank: { $exists: true },
      isDeleted: false,
      relatedBranch: { $exists: true },
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }
    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (bankType) query.bankType = bankType;
    if (createdBy) query.createdBy = mongoose.Types.ObjectId(createdBy);
    if (bankID) query.relatedBank = bankID;
    if (purchaseType) query.purchaseType = purchaseType;
    if (relatedDoctor) query.relatedDoctor = relatedDoctor;
    if (relatedBranch) {
      query.relatedBranch = mongoose.Types.ObjectId(relatedBranch);
    }
    if (tsType) {
      query.tsType = tsType;
    } else {
      query.tsType = "MS";
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipIndex = (pageNumber - 1) * limitNumber;

    // Aggregate query for bank payments
    const bankResult = await TreatmentVoucher.aggregate([
      {
        $match: {
          ...query,
          Refund: false,
          paymentType: "Cash",
        },
      },
      {
        $group: {
          _id: null,
          totalPaidAmountSum: { $sum: { $ifNull: ["$totalPaidAmount", 0] } },
          msPaidAmount: { $sum: { $ifNull: ["$msPaidAmount", 0] } },
          psPaidAmount: { $sum: { $ifNull: ["$psPaidAmount", 0] } },
          paidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaidAmountSum: {
            $add: [
              "$totalPaidAmountSum",
              "$msPaidAmount",
              "$psPaidAmount",
              "$paidAmount",
            ],
          },
        },
      },
      {
        $skip: skipIndex,
      },
      {
        $limit: limitNumber,
      },
    ]);

    // Process bankResult and populate as needed
    console.log("Bank Result:", bankResult);

    if (bankResult.length > 0) {
      response.data.bankResult = bankResult[0]; // Assuming you want to set the first result
    } else {
      response.data.bankResult = {
        totalPaidAmountSum: 0,
        bankPaymentSum: 0,
      };
    }

    // Example to add metadata to the response
    const totalItems = await TreatmentVoucher.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNumber);

    response._metadata = {
      totalItems: totalItems,
      totalPages: totalPages,
      currentPage: pageNumber,
      itemsPerPage: limitNumber,
    };

    return res.status(200).send(response);
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.treatmentFilterWithBankTSMulti = async (req, res) => {
  let response = {
    success: true,
    _metadata: {},
    data: {},
  };

  try {
    const {
      startDate,
      endDate,
      createdBy,
      purchaseType,
      relatedDoctor,
      bankType,
      tsType,
      relatedPatient,
      bankID,
      relatedBranch,
      income,
      page = 1,
      limit = 30,
    } = req.query;

    let query = {
      relatedBank: { $exists: true },
      isDeleted: false,
      relatedBranch: { $exists: true },
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Check if the created Date objects are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).send({
          error: true,
          message: "Invalid startDate or endDate format.",
        });
      }

      // Ensure the end date captures the full day
      query.createdAt = {
        $gte: start,
        $lte: new Date(end.setHours(23, 59, 59, 999)), // End of the day
      };
    }

    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (bankType) query.bankType = bankType;
    if (createdBy) query.createdBy = mongoose.Types.ObjectId(createdBy);
    if (bankID) query.relatedBank = bankID;
    if (purchaseType) query.purchaseType = purchaseType;
    if (relatedDoctor) query.relatedDoctor = relatedDoctor;
    if (relatedBranch) {
      query.relatedBranch = mongoose.Types.ObjectId(relatedBranch);
    }
    if (tsType) {
      query.tsType = tsType;
    } else {
      query.tsType = "TSMulti";
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipIndex = (pageNumber - 1) * limitNumber;

    // Aggregate query for bank payments
    const bankResult = await TreatmentVoucher.aggregate([
      {
        $match: {
          ...query,
          Refund: false,
          paymentType: "Bank",
        },
      },
      {
        $group: {
          _id: null,
          totalPaidAmountSum: { $sum: { $ifNull: ["$totalPaidAmount", 0] } },
          msPaidAmount: { $sum: { $ifNull: ["$msPaidAmount", 0] } },
          psPaidAmount: { $sum: { $ifNull: ["$psPaidAmount", 0] } },
          paidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaidAmountSum: {
            $add: [
              "$totalPaidAmountSum",
              "$msPaidAmount",
              "$psPaidAmount",
              "$paidAmount",
            ],
          },
        },
      },
      {
        $skip: skipIndex,
      },
      {
        $limit: limitNumber,
      },
    ]);

    // Process bankResult and populate as needed
    console.log("Bank Result:", bankResult);

    if (bankResult.length > 0) {
      response.data.bankResult = bankResult[0]; // Assuming you want to set the first result
    } else {
      response.data.bankResult = {
        totalPaidAmountSum: 0,
        bankPaymentSum: 0,
      };
    }

    // Example to add metadata to the response
    const totalItems = await TreatmentVoucher.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNumber);

    response._metadata = {
      totalItems: totalItems,
      totalPages: totalPages,
      currentPage: pageNumber,
      itemsPerPage: limitNumber,
    };

    return res.status(200).send(response);
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.treatmentFilterWithCashTSMulti = async (req, res) => {
  let response = {
    success: true,
    _metadata: {},
    data: {},
  };

  try {
    const {
      startDate,
      endDate,
      createdBy,
      purchaseType,
      relatedDoctor,
      bankType,
      tsType,
      relatedPatient,
      bankID,
      relatedBranch,
      income,
      page = 1,
      limit = 30,
    } = req.query;

    let query = {
      relatedBank: { $exists: true },
      isDeleted: false,
      relatedBranch: { $exists: true },
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }
    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (bankType) query.bankType = bankType;
    if (createdBy) query.createdBy = mongoose.Types.ObjectId(createdBy);
    if (bankID) query.relatedBank = bankID;
    if (purchaseType) query.purchaseType = purchaseType;
    if (relatedDoctor) query.relatedDoctor = relatedDoctor;
    if (relatedBranch) {
      query.relatedBranch = mongoose.Types.ObjectId(relatedBranch);
    }
    if (tsType) {
      query.tsType = tsType;
    } else {
      query.tsType = "TSMulti";
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipIndex = (pageNumber - 1) * limitNumber;

    // Aggregate query for bank payments
    const bankResult = await TreatmentVoucher.aggregate([
      {
        $match: {
          ...query,
          Refund: false,
          paymentType: "Cash",
        },
      },
      {
        $group: {
          _id: null,
          totalPaidAmountSum: { $sum: { $ifNull: ["$totalPaidAmount", 0] } },
          msPaidAmount: { $sum: { $ifNull: ["$msPaidAmount", 0] } },
          psPaidAmount: { $sum: { $ifNull: ["$psPaidAmount", 0] } },
          paidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaidAmountSum: {
            $add: [
              "$totalPaidAmountSum",
              "$msPaidAmount",
              "$psPaidAmount",
              "$paidAmount",
            ],
          },
        },
      },
      {
        $skip: skipIndex,
      },
      {
        $limit: limitNumber,
      },
    ]);

    // Process bankResult and populate as needed
    console.log("Bank Result:", bankResult);

    if (bankResult.length > 0) {
      response.data.bankResult = bankResult[0]; // Assuming you want to set the first result
    } else {
      response.data.bankResult = {
        totalPaidAmountSum: 0,
        bankPaymentSum: 0,
      };
    }

    // Example to add metadata to the response
    const totalItems = await TreatmentVoucher.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNumber);

    response._metadata = {
      totalItems: totalItems,
      totalPages: totalPages,
      currentPage: pageNumber,
      itemsPerPage: limitNumber,
    };

    return res.status(200).send(response);
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.NewTreatmentVoucherFilterCash = async (req, res) => {
  let response = {
    success: true,
    _metadata: {},
    data: {},
  };

  try {
    const {
      startDate,
      endDate,
      createdBy,
      tsType,
      relatedBranch,
      page = 1,
      limit = 30,
    } = req.query;

    // Construct the query based on provided parameters
    let query = {
      relatedBank: { $exists: true },
      isDeleted: false,
      relatedBranch: { $exists: true },
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Check if the created Date objects are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).send({
          error: true,
          message: "Invalid startDate or endDate format.",
        });
      }

      // Ensure the end date captures the full day
      query.createdAt = {
        $gte: start,
        $lte: new Date(end.setHours(23, 59, 59, 999)), // End of the day
      };
    }

    if (createdBy) query.createdBy = mongoose.Types.ObjectId(createdBy);
    if (relatedBranch) {
      query.relatedBranch = mongoose.Types.ObjectId(relatedBranch);
    }
    if (tsType) {
      query.tsType = tsType;
    } else {
      query.tsType = { $in: ["TSMulti", "MS"] };
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipIndex = (pageNumber - 1) * limitNumber;

    // Aggregate query for payment summary
    const paymentResult = await TreatmentVoucher.aggregate([
      {
        $match: {
          ...query,
        },
      },
      {
        $group: {
          _id: null,
          totalPaidAmount: { $sum: { $ifNull: ["$totalPaidAmount", 0] } },
          msPaidAmount: { $sum: { $ifNull: ["$msPaidAmount", 0] } },
          paidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          sumPaidAmounts: {
            $add: ["$totalPaidAmount", "$msPaidAmount", "$paidAmount"],
          },
          cashPaymentTypeSum: {
            $cond: {
              if: { $eq: ["$paymentType", "Cash"] },
              then: {
                $add: ["$totalPaidAmount", "$msPaidAmount", "$paidAmount"],
              },
              else: 0,
            },
          },
        },
      },
      {
        $skip: skipIndex,
      },
      {
        $limit: limitNumber,
      },
    ]);

    // Process paymentResult and populate as needed
    console.log("Payment Result:", paymentResult);

    if (paymentResult.length > 0) {
      response.data.paymentResult = paymentResult[0]; // Assuming you want to set the first result
    } else {
      response.data.paymentResult = {
        sumPaidAmounts: 0,
        cashPaymentTypeSum: 0,
      };
    }

    // Example to add metadata to the response
    const totalItems = await TreatmentVoucher.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNumber);

    response._metadata = {
      totalItems: totalItems,
      totalPages: totalPages,
      currentPage: pageNumber,
      itemsPerPage: limitNumber,
    };

    return res.status(200).send(response);
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.TreatmentVoucherFilter = async (req, res) => {
  let secondBankCashAmount = [];
  let firstBankName = [];
  let firstCashName = [];
  let secondCashName = [];

  let query = {
    relatedBank: { $exists: true },
    isDeleted: false,
    relatedBranch: { $exists: true },
  };

  let response = {
    success: true,
    _metadata: {},
    data: {},
  };

  try {
    const {
      startDate,
      endDate,
      createdBy,
      purchaseType,
      relatedDoctor,
      bankType,
      tsType,
      relatedPatient,
      bankID,
      relatedBranch,
      income,
      page = 1,
      limit = 30,
    } = req.query;

    if (startDate && endDate) {
      query.createdAt = {
        $gte: startDate, // Converting to Date object
        $lte: endDate, // End of day
      };
    }

    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (bankType) query.bankType = bankType;

    if (createdBy) {
      query.createdBy = mongoose.Types.ObjectId(createdBy); // Converting to ObjectId
    }

    if (bankID) query.relatedBank = bankID;
    if (purchaseType) query.purchaseType = purchaseType;
    if (relatedDoctor) query.relatedDoctor = relatedDoctor;

    if (relatedBranch) {
      query.relatedBranch = mongoose.Types.ObjectId(relatedBranch); // Converting to ObjectId
    }

    if (tsType) {
      query.tsType = tsType;
    } else {
      query.tsType = { $in: ["TSMulti", "MS"] }; // Default value when tsType is missing
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipIndex = (pageNumber - 1) * limitNumber;

    // const cacheKey = JSON.stringify(query);
    // const getCaches = cacheHelper.get(cacheKey)
    // if(getCaches){
    //     return res.status(200).send(getCaches)
    // }

    console.log("Modified Query:", query);

    let bankResult = await TreatmentVoucher.find({ ...query, Refund: false })
      .populate(
        "medicineItems.item_id multiTreatment.item_id relatedTreatment relatedBranch relatedDoctor relatedBank relatedCash relatedPatient relatedAccounting payment createdBy newTreatmentVoucherId relatedRepay"
      )
      .populate({
        path: "relatedTreatmentSelection",
        populate: [
          {
            path: "relatedAppointments",
            populate: {
              path: "relatedDoctor",
              model: "Doctors",
            },
          },
          {
            path: "relatedTreatment",
            model: "Treatments",
          },
        ],
      })
      .populate({
        path: "secondAccount",
        model: "AccountingLists",
        populate: {
          path: "relatedHeader",
          model: "AccountHeaders",
        },
      })
      .populate({
        path: "relatedTreatmentPackage",
        populate: {
          path: "item_id",
        },
      })
      .skip(skipIndex)
      .limit(limitNumber);

    console.log("Bank Result:", bankResult);

    let allBankResult = await TreatmentVoucher.find(query)
      .populate(
        "medicineItems.item_id multiTreatment.item_id relatedTreatment relatedBranch relatedDoctor relatedBank relatedCash relatedPatient relatedAccounting payment createdBy newTreatmentVoucherId relatedRepay"
      )
      .populate({
        path: "relatedTreatmentSelection",
        populate: [
          {
            path: "relatedAppointments",
            populate: {
              path: "relatedDoctor",
              model: "Doctors",
            },
          },
          {
            path: "relatedTreatment",
            model: "Treatments",
          },
        ],
      })
      .populate({
        path: "secondAccount",
        model: "AccountingLists",
        populate: {
          path: "relatedHeader",
          model: "AccountHeaders",
        },
      })
      .populate({
        path: "relatedTreatmentPackage",
        populate: {
          path: "item_id",
        },
      });

    if (!bankID) {
      const { relatedBank, ...query2 } = query;
      query2.relatedCash = { $exists: true };
      if (startDate && endDate)
        query2.createdAt = { $gte: startDate, $lte: endDate };

      let cashResult = await TreatmentVoucher.find({ ...query2, Refund: false })
        .populate(
          "newTreatmentVoucherId medicineItems.item_id multiTreatment.item_id relatedTreatment secondAccount relatedBranch relatedDoctor relatedBank relatedCash relatedPatient relatedAccounting payment createdBy relatedRepay"
        )
        .populate({
          path: "relatedTreatmentSelection",
          populate: [
            {
              path: "relatedAppointments",
              populate: {
                path: "relatedDoctor",
                model: "Doctors",
              },
            },
            {
              path: "relatedTreatment",
              model: "Treatments",
            },
          ],
        })
        .populate({
          path: "secondAccount",
          model: "AccountingLists",
          populate: {
            path: "relatedHeader",
            model: "AccountHeaders",
          },
        })
        .populate({
          path: "relatedTreatmentPackage",
          populate: {
            path: "item_id",
          },
        });

      let allCashResult = await TreatmentVoucher.find(query2)
        .populate(
          "newTreatmentVoucherId medicineItems.item_id multiTreatment.item_id relatedTreatment secondAccount relatedBranch relatedDoctor relatedBank relatedCash relatedPatient relatedAccounting payment createdBy relatedRepay"
        )
        .populate({
          path: "relatedTreatmentSelection",
          populate: [
            {
              path: "relatedAppointments",
              populate: {
                path: "relatedDoctor",
                model: "Doctors",
              },
            },
            {
              path: "relatedTreatment",
              model: "Treatments",
            },
          ],
        })
        .populate({
          path: "relatedTreatmentPackage",
          populate: {
            path: "item_id",
          },
        });
      // if(secondAccount && secondAccount.relatedHeader.name === "Cash At Bank" ){
      //     const {name} = secondAccount;
      //     result[name] = secondAmount;

      //     }
      //query second Ammount account
      const CashNames = cashResult.reduce(
        (
          result,
          {
            Refund,
            tsType,
            relatedCash,
            paidAmount,
            msPaidAmount,
            totalPaidAmount,
            psPaidAmount,
            secondAccount,
            secondAmount,
          }
        ) => {
          //   console.log("paymont ",paidAmount,msPaidAmount,totalPaidAmount,tsType,secondAccount, secondAmount)

          if (
            secondAccount &&
            secondAccount.relatedHeader.name === "Cash At Bank"
          ) {
            const bankName = secondAccount.name;
            secondBankCashAmount.push({
              bankname: bankName,
              amount: secondAmount,
            });
          }

          if (relatedCash) {
            const { name } = relatedCash;
            result[name] =
              (result[name] || 0) +
              (paidAmount || 0) +
              (msPaidAmount || 0) +
              (totalPaidAmount || 0) +
              (psPaidAmount || 0);
          }
          //console.log("result ", result)
          return result;
        },
        {}
      );
      if (CashNames) {
        Object.keys(CashNames).forEach((key) =>
          firstCashName.push({ cashname: key, amount: CashNames[key] })
        );
      }
      const CashTotal = cashResult.reduce(
        (total, sale) =>
          total +
          (sale.paidAmount || 0) +
          (sale.msPaidAmount || 0) +
          (sale.totalPaidAmount || 0) +
          (sale.psPaidAmount || 0),
        0
      );
      income
        ? (response.data = {
            ...response.data,
            CashNames: CashNames,
            CashTotal: CashTotal,
          })
        : (response.data = {
            ...response.data,
            CashList: allCashResult,
            CashNames: CashNames,
            CashTotal: CashTotal,
          });
    }

    //filter solid beauty
    const BankNames = bankResult.reduce(
      (
        result,
        {
          Refund,
          relatedBank,
          paidAmount,
          msPaidAmount,
          totalPaidAmount,
          psPaidAmount,
          secondAccount,
          secondAmount,
        }
      ) => {
        if (
          secondAccount &&
          secondAccount.relatedHeader.name == "Cash In Hand"
        ) {
          let { name } = secondAccount;
          secondCashName.push({ cashname: name, amount: secondAmount });
        } else if (
          secondAccount &&
          secondAccount.relatedHeader.name === "Cash At Bank"
        ) {
          const bankName = secondAccount.name;
          secondBankCashAmount.push({
            bankname: bankName,
            amount: secondAmount,
          });
        }
        if (relatedBank) {
          const { name } = relatedBank;
          result[name] =
            (result[name] || 0) +
            (paidAmount || 0) +
            (msPaidAmount || 0) +
            (totalPaidAmount || 0) +
            (psPaidAmount || 0);
        }
        return result;
      },
      {}
    );

    const BankTotal = bankResult.reduce(
      (total, sale) =>
        total +
        (sale.paidAmount || 0) +
        (sale.msPaidAmount || 0) +
        (sale.totalPaidAmount || 0) +
        (sale.psPaidAmount || 0),
      0
    );

    console.log("Bank Total", BankTotal);

    //     if( bankResult.secondAccount || cashResult.secondAccount ) {
    //         // if(bankResult.secondAccount && bankResult.secondAccount.relatedHeader.name === "Cash At Bank" ){
    //         //     const {name} =bankResult.secondAccount;
    //         // }
    //          if(cashResult && cash.secondAccount && cashResult.secondAccount.relatedHeader.name === "Cash At Bank" ){
    //             const {name} =cashResult.secondAccount;
    //             response.data = {...response.data, name: cash.secondAmount }
    //         }
    //    }

    //    if (secondBankAndCashAccount.hasOwnProperty(key)) {

    //     console.log(`${key}: ${secondBankAndCashAccount[key]}`);
    //     }

    // for(let i=0; i < secondBankCashAmount.length; i++){

    // }

    let secondBank = secondBankCashAmount.reduce((result, nextresult) => {
      const equalBankName = result.find(
        (t) => t.bankname === nextresult.bankname
      );

      if (equalBankName) {
        equalBankName.amount += nextresult.amount;
      } else {
        result.push({
          bankname: nextresult.bankname,
          amount: nextresult.amount,
        });
      }

      return result;
    }, []);

    //key.bankname == value.bankname ? {bankname:key.name,amount:key.amount+value.amount} : ""
    // console.log('equeal ',secondBank)
    // Object.keys(secondBankCashAmount).forEach(key=> BankNames[key] && secondBankAndCashAccount[key] ? BankNames[key] = BankNames[key] + secondBankAndCashAccount[key] : BankNames[key] = BankNames[key] || secondBankAndCashAccount[key] )
    //     //console.log("juis ",secondBankAndCashAccount[key], BankNames[key]))
    //

    if (BankNames) {
      Object.keys(BankNames).forEach((key) =>
        firstBankName.push({ bankname: key, amount: BankNames[key] })
      );
    }
    income
      ? (response.data = {
          ...response.data,
          firstBankNames: firstBankName,
          firstCashNames: firstCashName,
          secondBankNames: secondBank,
          secondCashNames: secondCashName,
          BankTotal: BankTotal,
        })
      : (response.data = {
          ...response.data,
          BankList: allBankResult,
          firstBankNames: firstBankName,
          firstCashNames: firstCashName,
          secondBankNames: secondBank,
          secondCashNames: secondCashName,
          BankTotal: BankTotal,
        });
    // repay amount in branch
    const { relatedBank, createdAt, ...queryRepay } = query;
    delete queryRepay.createdBy;
    if (startDate && endDate)
      queryRepay.repaymentDate = {
        $gte: moment.tz("Asia/Yangon").format(startDate),
        $lte: moment.tz("Asia/Yangon").format(endDate),
      };
    const totalRepay = await totalRepayFunction(queryRepay);

    // Add pagination metadata
    const totalItems = await TreatmentVoucher.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNumber);

    response.data = {
      ...response.data,
      repay: totalRepay,
    };

    response._metadata = {
      totalItems: totalItems,
      totalPages: totalPages,
      currentPage: pageNumber,
      itemsPerPage: limitNumber,
    };
    //console.log("next second amount  ",secondBankCashAmount)
    // cacheHelper.set(cacheKey, response)
    return res.status(200).send(response);
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.VersionOneTreatmentVoucherFilter = async (req, res) => {
  let { page = 1, limit = 30 } = req.query;
  let secondBankAndCashAccount = {};
  let secondBankCashAmount = [];
  let firstBankName = [];
  let firstCashName = [];
  let secondCashName = [];
  let query = { relatedBank: { $exists: true }, isDeleted: false };

  page = parseInt(page);
  limit = parseInt(Math.min(limit, 30));
  const skip = (page - 1) * limit;

  let response = {
    success: true,
    _metadata: {},
    data: {},
  };

  try {
    const {
      startDate,
      endDate,
      createdBy,
      purchaseType,
      relatedDoctor,
      bankType,
      tsType,
      relatedPatient,
      bankID,
      relatedBranch,
      income,
    } = req.query;

    let matchStage = {
      isDeleted: false,
      relatedBank: { $exists: true },
    };

    if (startDate && endDate) {
      matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }
    if (relatedPatient) matchStage.relatedPatient = relatedPatient;
    if (bankType) matchStage.bankType = bankType;
    if (createdBy) matchStage.createdBy = createdBy;
    if (tsType) matchStage.tsType = tsType;
    if (bankID) matchStage.relatedBank = bankID;
    if (purchaseType) matchStage.purchaseType = purchaseType;
    if (relatedDoctor) matchStage.relatedDoctor = relatedDoctor;
    if (relatedBranch) matchStage.relatedBranch = relatedBranch;

    const QueryPipeline = [
      { $match: matchStage },

      { $match: { Refund: false } },

      {
        $lookup: {
          from: "medicineitems",
          localField: "medicineItems.item_id",
          foreignField: "_id",
          as: "medicineItems",
        },
      },

      {
        $lookup: {
          from: "treatments",
          localField: "multiTreatment.item_id",
          foreignField: "_id",
          as: "multiTreatment",
        },
      },

      {
        $lookup: {
          from: "treatments",
          localField: "relatedTreatment",
          foreignField: "_id",
          as: "relatedTreatment",
        },
      },

      {
        $lookup: {
          from: "branches",
          localField: "relatedBranch",
          foreignField: "_id",
          as: "relatedBranch",
        },
      },

      {
        $lookup: {
          from: "doctors",
          localField: "relatedDoctor",
          foreignField: "_id",
          as: "relatedDoctor",
        },
      },

      {
        $lookup: {
          from: "accountinglists",
          localField: "relatedBank",
          foreignField: "_id",
          as: "relatedBank",
        },
      },

      {
        $lookup: {
          from: "accountinglists",
          localField: "relatedCash",
          foreignField: "_id",
          as: "relatedCash",
        },
      },

      {
        $lookup: {
          from: "patients",
          localField: "relatedPatient",
          foreignField: "_id",
          as: "relatedPatient",
        },
      },

      {
        $lookup: {
          from: "accountinglists",
          localField: "relatedAccounting",
          foreignField: "_id",
          as: "relatedAccounting",
        },
      },

      {
        $lookup: {
          from: "attachments",
          localField: "payment",
          foreignField: "_id",
          as: "payment",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },

      {
        $lookup: {
          from: "treatmentvouchers",
          localField: "newTreatmentVoucherId",
          foreignField: "_id",
          as: "newTreatmentVoucherId",
        },
      },

      {
        $lookup: {
          from: "repayments",
          localField: "relatedRepay",
          foreignField: "_id",
          as: "relatedRepay",
        },
      },

      {
        $lookup: {
          from: "treatmentselections",
          localField: "relatedTreatmentSelection",
          foreignField: "_id",
          as: "relatedTreatmentSelection",
        },
      },

      {
        $unwind: {
          path: "$relatedTreatmentSelection",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "appointments",
          localField: "relatedTreatmentSelection.relatedAppointments",
          foreignField: "_id",
          as: "relatedAppointments",
        },
      },

      {
        $unwind: {
          path: "$relatedAppointments",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "doctors",
          localField: "relatedAppointments.relatedDoctor",
          foreignField: "_id",
          as: "relatedDoctor",
        },
      },

      {
        $unwind: {
          path: "$relatedDoctor",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "accountinglists",
          localField: "secondAccount",
          foreignField: "_id",
          as: "secondAccount",
        },
      },

      {
        $unwind: {
          path: "$secondAccount",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "accountheaders",
          localField: "secondAccount.relatedHeader",
          foreignField: "_id",
          as: "secondAccount.relatedHeader",
        },
      },

      {
        $unwind: {
          path: "$secondAccount.relatedHeader",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "treatmentpackages",
          localField: "relatedTreatmentPackage.item_id",
          foreignField: "_id",
          as: "relatedTreatmentPackage",
        },
      },

      {
        $unwind: {
          path: "$relatedTreatmentPackage",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    let bankResult = await TreatmentVoucher.aggregate(QueryPipeline)
      .skip(skip)
      .limit(limit);

    response.data = {
      ...response.data,
      bankResult,
    };
  } catch (error) {
    return res.status(500).send({
      error: true,
      message: error.message,
    });
  }
};

exports.showAllTreatmentVouchers = async (req, res) => {
  let { relatedBranch, page = 1, limit = 10, keyword } = req.query;

  let response = {
    success: true,
    meta_data: {},
    data: {},
  };

  try {
    limit = +limit <= 100 ? +limit : 20; // Limit to 100 or default to 20
    page = +page || 1;
    const skip = (page - 1) * limit;

    let query = { relatedBranch, isDeleted: false };

    if (keyword && /\w/.test(keyword)) {
      const regexKeyword = new RegExp(keyword, "i");
      query["name"] = regexKeyword; // Adjust this field to match your schema
    }

    let bankResult = await TreatmentVoucher.find({ ...query, Refund: false })
      .populate(
        "medicineItems.item_id multiTreatment.item_id relatedTreatment relatedBranch relatedDoctor relatedBank relatedCash relatedPatient relatedAccounting payment createdBy newTreatmentVoucherId relatedRepay"
      )
      .populate({
        path: "relatedTreatmentSelection",
        populate: [
          {
            path: "relatedAppointments",
            populate: {
              path: "relatedDoctor",
              model: "Doctors",
            },
          },
          {
            path: "relatedTreatment",
            model: "Treatments",
          },
        ],
      })
      .populate({
        path: "secondAccount",
        model: "AccountingLists",
        populate: {
          path: "relatedHeader",
          model: "AccountHeaders",
        },
      })
      .populate({
        path: "relatedTreatmentPackage",
        populate: {
          path: "item_id",
        },
      })
      .skip(skip)
      .limit(limit);

    const totalDocuments = await TreatmentVoucher.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);

    response.data = {
      ...response.data,
      bankResult,
    };

    response.meta_data = {
      current_page: page,
      per_page: limit,
      page_count: totalPages,
      total_count: totalDocuments,
    };

    return res.status(200).send(response);
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.createSpecificItemExcelForTreatmentVoucher = async (req, res) => {
  try {
    let query = { isDeleted: false, Refund: false };
    let { startDate, endDate, relatedBranch, createdBy, tsType } = req.query;
    let medicineData = [];
    let treatmentData = [];
    startDate && endDate
      ? (query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        })
      : startDate
      ? (query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(startDate),
        })
      : endDate
      ? (query.createdAt = { $gte: new Date(endDate), $lte: new Date(endDate) })
      : "";
    relatedBranch ? (query.relatedBranch = relatedBranch) : "";
    createdBy ? (query.createdBy = createdBy) : "";
    tsType ? (query.tsType = tsType) : "";
    const repay = await repayment.find({
      relatedBranch: ObjectId(relatedBranch),
    });
    const result = await TreatmentVoucher.find(query).populate(
      "medicineItems.item_id multiTreatment.item_id relatedTreatment secondAccount relatedBranch relatedDoctor relatedBank relatedCash relatedPatient relatedTreatmentSelection relatedAccounting payment createdBy relatedRepay"
    );
    result.map((data) => {
      const filterRepayByVoucherId = repay.filter(
        (re) => re.relatedTreatmentVoucher.toString() === data._id.toString()
      );
      //  console.log(filterRepayByVoucherId, "voucher")
      if (data.tsType === "MS") {
        if (data.medicineItems.length != 0) {
          let { $__, $isNew, _doc } = data;
          let { medicineItems, ...datas } = _doc;
          medicineItems.map((medicineItem, index) => {
            //only add data to first data
            if (index === 0) {
              if (filterRepayByVoucherId.length > 0) {
                filterRepayByVoucherId.map((data, index) => {
                  datas["repaymentDate" + (index + 1)] = data.repaymentDate;
                  datas["repaymentAmount" + (index + 1)] = data.repaymentAmount;
                  datas["repaymentRemaininngCredit" + (index + 1)] =
                    data.remaningCredit;
                });
              }
              medicineData.push({ ...datas, item: medicineItem });
            } else {
              datas.msTotalAmount = 0;
              datas.msPaidAmount = 0;
              datas.msTotalDiscountAmount = 0;
              datas.msGrandTotal = 0;
              datas.msBalance = 0;
              medicineData.push({ ...datas, item: medicineItem });
            }
          });
        }
      }
      if (data.tsType === "TSMulti") {
        if (data.multiTreatment.length != 0) {
          let { $__, $isNew, _doc } = data;
          let { multiTreatment, ...datas } = _doc;
          multiTreatment.map((treatmentItem, index) => {
            //only add data to first data
            if (index === 0) {
              if (filterRepayByVoucherId.length > 0) {
                filterRepayByVoucherId.map((data, index) => {
                  datas["repaymentDate" + (index + 1)] = data.repaymentDate;
                  datas["repaymentAmount" + (index + 1)] = data.repaymentAmount;
                  datas["repaymentRemainingCredit" + (index + 1)] =
                    data.remaningCredit;
                });
              }
              treatmentData.push({ ...datas, item: treatmentItem });
            } else {
              datas.totalAmount = 0;
              datas.totalPaidAmount = 0;
              datas.totalDiscount = 0;
              datas.balance = 0;
              treatmentData.push({ ...datas, item: treatmentItem });
            }
          });
        }
      }
    });
    res.status(200).send({
      success: true,
      medicine: medicineData,
      treatment: treatmentData,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.addDeliveryInfo = async (req, res, next) => {
  try {
    const { deliveryDate, deliveryPerson, deliveryDescription, type } =
      req.body;
    const { id } = req.params;
    let result;
    type === "knas"
      ? (result = await KmaxVoucher.findByIdAndUpdate(
          id,
          {
            deliveryDate: deliveryDate,
            deliveryPerson: deliveryPerson,
            deliveryDescription: deliveryDescription,
          },
          { new: true }
        ))
      : (result = await treatmentVoucher.findByIdAndUpdate(
          { _id: id },
          {
            deliveryDate: deliveryDate,
            deliveryPerson: deliveryPerson,
            deliveryDescription: deliveryDescription,
          },
          { new: true }
        ));

    return res.status(200).send({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};
