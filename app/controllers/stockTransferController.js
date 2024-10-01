"use strict";
const StockTransfer = require("../models/stockTransfer");
const Stock = require("../models/stock");
const StockRequest = require("../models/stockRequest");
const ProcedureMedicine = require("../models/procedureItem");
const MedicineLists = require("../models/medicineItem");
const ProcedureAccessory = require("../models/accessoryItem");
const General = require("../models/generalItem");
const Branch = require("../models/branch");
const Transaction = require("../models/transaction");
const Accounting = require("../models/accountingList");
const Log = require("../models/log");

exports.listAllStockTransfers = async (req, res) => {
  let { keyword, role, limit, skip } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 10; //limit
    skip = +skip || 0;
    let query = req.mongoQuery,
      regexKeyword;
    role ? (query["role"] = role.toUpperCase()) : "";
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, "i"))
      : "";
    regexKeyword ? (query["name"] = regexKeyword) : "";
    let result = await StockTransfer.find(query).sort({ date: -1 });
    count = await StockTransfer.find(query).count();
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
    console.log(e);
    return res.status(500).send({ error: true, message: e.message });
  }
};

exports.listAllStockRequests = async (req, res) => {
  let { keyword, role, limit, skip, relatedBranch } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 10; //limit
    skip = +skip || 0;
    let query = req.mongoQuery,
      regexKeyword;
    role ? (query["role"] = role.toUpperCase()) : "";
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, "i"))
      : "";
    regexKeyword ? (query["name"] = regexKeyword) : "";
    relatedBranch ? (query["relatedBranch"] = relatedBranch) : " ";
    let result = await StockTransfer.find(query).populate(
      "procedureMedicine.item_id medicineLists.item_id procedureAccessory.item_id generalItems.item_id relatedBranch"
    );
    count = await StockTransfer.find(query).count();
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

exports.getStockTransfer = async (req, res) => {
  let query = req.mongoQuery;
  if (req.params.id) query._id = req.params.id;
  const result = await StockTransfer.find(query).populate(
    "procedureMedicine.item_id medicineLists.item_id procedureAccessory.item_id generalItems.item_id relatedBranch"
  );
  if (result.length === 0)
    return res.status(500).json({ error: true, message: "No Record Found" });
  return res.status(200).send({ success: true, data: result });
};

exports.createStockTransfer = async (req, res, next) => {
  console.log(req.body, "body");
  let createdBy = req.credentials.id;
  let newBody = req.body;

  const { procedureMedicine, medicineLists, procedureAccessory, generalItems } =
    req.body;
  let procedureMedicineError = [];
  let medicineListsError = [];
  let procedureAccessoryError = [];
  let procedureMedicineFinished = [];
  let medicineListsFinished = [];
  let procedureAccessoryFinished = [];
  let generalItemsError = [];
  let generalItemsFinished = [];
  const gen = generalItems.reduce((total, sale) => total + sale.totalPrice, 0);
  const pAcc = procedureAccessory.reduce(
    (total, sale) => total + sale.totalPrice,
    0
  );
  const med = medicineLists.reduce((total, sale) => total + sale.totalPrice, 0);
  const pMed = procedureMedicine.reduce(
    (total, sale) => total + sale.totalPrice,
    0
  );
  const procedureMedicineRes = procedureMedicine.reduce(
    (total, sale) => total + sale.purchasePrice,
    0
  );
  const medicineListsRes = medicineLists.reduce(
    (total, sale) => total + sale.purchasePrice,
    0
  );
  const procedureAccessoryRes = procedureAccessory.reduce(
    (total, sale) => total + sale.purchasePrice,
    0
  );
  const generalItemsRes = generalItems.reduce(
    (total, sale) => total + sale.purchasePrice,
    0
  );
  console.log(
    procedureMedicineRes,
    medicineListsRes,
    procedureAccessoryRes,
    generalItemsRes
  );
  const total =
    procedureAccessoryRes +
    medicineListsRes +
    procedureAccessoryRes +
    generalItemsRes;
  console.log(total, "total");
  const firstTransaction = {
    amount: total,
    date: Date.now(),
    remark: null,
    type: "Credit",
    relatedAccounting: "646733c359a9bc811d97ef09", //closing stock
    relatedBranch: req.body.relatedBranch,
  };
  const newTrans = new Transaction(firstTransaction);
  var fTransResult = await newTrans.save();
  var amountUpdate = await Accounting.findOneAndUpdate(
    { _id: "646733c359a9bc811d97ef09" },
    { $inc: { amount: -total } }
  );

  const getBranch = await Branch.find({ _id: req.body.relatedBranch });

  const branch = getBranch[0].name;
  let secID = "";
  console.log(branch);
  switch (branch) {
    case "SOK":
      secID = "648ac0b45a6bb1362e43c3e3";
      break; //SOK Purchase COGS
    case "8MILE":
      secID = "648ac0d05a6bb1362e43c3e9";
      break; //8 Mile Purchase COGS
    case "NPT":
      secID = "648ac1365a6bb1362e43c401";
      break; // NPT Purchase COGS
    case "LSH":
      secID = "648ac3845a6bb1362e43e288";
      break; // MDY Purchase COGS
    case "MDY":
      secID = "648ac3645a6bb1362e43e1ea";
      break; // MDY Purchase COGS
    case "TCL":
      secID = "649559535fc22f0e7f0884fe";
      break;
    case "KShopping":
      secID = "64b6064a61cdd336e64f9300";
      break;
    case "Taungyi":
      secID = "651647a617c8dbb264085bcf";
      break;
    case "KNAS":
      secID = "651f84c519683c5a91239741";
      break;
    case "SanChaung":
      secID = "6535f7fef68b0525e0eaf151";
      break;
    case "Thingangyun":
      secID = "6535f811f68b0525e0eaf152";
    case "Hlaing Thar Yar":
      secID = "66023ad88bb368fe815343da";
      break;
    case "Tamwe":
      secID = "66ed176674f503bf95858cf8";
      break;
    default:
      return null;
  }
  console.log("here");
  console.log(secID, "secID");
  if (secID) {
    const secTransaction = {
      amount: total,
      date: Date.now(),
      remark: null,
      type: "Debit",
      relatedAccounting: secID, //closing stock
      relatedBranch: req.body.relatedBranch,
    };
    const newTrans = new Transaction(secTransaction);
    var sTransResult = await newTrans.save();
    var amountUpdate2 = await Accounting.findOneAndUpdate(
      { _id: secID },
      { $inc: { amount: total } }
    );
  }
  try {
    if (procedureMedicine !== undefined) {
      procedureMedicine.map(async (e, i) => {
        if (e.stockQty < e.transferQty) {
          procedureMedicineError.push(e);
        } else if (e.stockQty >= e.transferQty) {
          let currentQty = e.stockQty - e.transferQty; //both must be currentQty
          const result = await ProcedureMedicine.find({ _id: e.item_id });
          const from = result[0].fromUnit;
          const to = result[0].toUnit;
          let totalUnit = (to * currentQty) / from;
          try {
            procedureMedicineFinished.push(e);
            // const stockResult = await Stock.findOneAndUpdate(
            //   { relatedProcedureItems: e.item_id, relatedBranch: req.mongoQuery.relatedBranch },
            //   { $inc: { currentQty: e.transferQty } }
            // )
            const mainResult = await ProcedureMedicine.findOneAndUpdate(
              { _id: e.item_id },
              { totalUnit: totalUnit, currentQuantity: currentQty }
            );
            const logResult = await Log.create({
              relatedProcedureItems: e.item_id,
              currentQty: e.stockQty,
              actualQty: e.transferQty,
              finalQty: currentQty,
              type: "Stock Transfer",
              relatedBranch: relatedBranch,
              createdBy: createdBy,
            });
            pMed = pMed + parseInt(e.totalPrice);
          } catch (error) {
            procedureMedicineError.push(e);
          }
        }
      });
    }
    if (medicineLists !== undefined) {
      medicineLists.map(async (e, i) => {
        if (e.stockQty < e.transferQty) {
          medicineListsError.push(e);
        } else if (e.stockQty >= e.transferQty) {
          let currentQty = e.stockQty - e.transferQty; //both must be currentQty
          const result = await MedicineLists.find({ _id: e.item_id });
          const from = result[0].fromUnit;
          const to = result[0].toUnit;
          let totalUnit = (to * currentQty) / from;
          try {
            medicineListsFinished.push(e);
            // const stockResult = await Stock.findOneAndUpdate(
            //   { relatedMedicineItems: e.item_id, relatedBranch: req.mongoQuery.relatedBranch },
            //   { $inc: { currentQty: e.transferQty } }
            // )
            const mainResult = await MedicineLists.findOneAndUpdate(
              { _id: e.item_id },
              { currentQuantity: currentQty, totalUnit: totalUnit }
            );
            const logResult = await Log.create({
              relatedMedicineItems: e.item_id,
              currentQty: e.stockQty,
              actualQty: e.transferQty,
              finalQty: currentQty,
              type: "Stock Transfer",
              relatedBranch: relatedBranch,
              createdBy: createdBy,
            });
            med = med + parseInt(e.totalPrice);
          } catch (error) {
            medicineListsError.push(e);
          }
        }
      });
    }
    if (procedureAccessory !== undefined) {
      procedureAccessory.map(async (e, i) => {
        if (e.stockQty < e.transferQty) {
          procedureAccessoryError.push(e);
        } else if (e.stockQty >= e.transferQty) {
          let currentQty = e.stockQty - e.transferQty; //both must be currentQty
          const result = await ProcedureAccessory.find({ _id: e.item_id });
          const from = result[0].fromUnit;
          const to = result[0].toUnit;
          let totalUnit = (to * currentQty) / from;
          try {
            procedureAccessoryFinished.push(e);
            // const stockResult = await Stock.findOneAndUpdate(
            //   { relatedAccessoryItems: e.item_id, relatedBranch: req.mongoQuery.relatedBranch },
            //   { $inc: { currentQty: e.transferQty } }
            // )
            const mainResult = await ProcedureAccessory.findOneAndUpdate(
              { _id: e.item_id },
              { currentQuantity: currentQty, totalUnit: totalUnit }
            );
            const logResult = await Log.create({
              relatedAccessoryItems: e.item_id,
              currentQty: e.stockQty,
              actualQty: e.transferQty,
              finalQty: currentQty,
              type: "Stock Transfer",
              relatedBranch: relatedBranch,
              createdBy: createdBy,
            });
            // const log = await Log.create({
            pAcc = pAcc + parseInt(e.totalPrice);
            // })
          } catch (error) {
            procedureAccessoryError.push(e);
          }
        }
      });
    }

    if (generalItems !== undefined) {
      generalItems.map(async (e, i) => {
        if (e.stockQty < e.transferQty) {
          generalItemsError.push(e);
        } else if (e.stockQty >= e.transferQty) {
          let currentQty = e.stockQty - e.transferQty; //both must be currentQty
          const result = await General.find({ _id: e.item_id });
          const from = result[0].fromUnit;
          const to = result[0].toUnit;
          let totalUnit = (to * currentQty) / from;
          try {
            generalItemsFinished.push(e);
            // const stockResult = await Stock.findOneAndUpdate(
            //   { relatedMedicineItems: e.item_id, relatedBranch: req.mongoQuery.relatedBranch },
            //   { $inc: { currentQty: e.transferQty } }
            // )
            const mainResult = await General.findOneAndUpdate(
              { _id: e.item_id },
              { currentQuantity: currentQty, totalUnit: totalUnit }
            );
            const logResult = await Log.create({
              relatedGeneralItems: e.item_id,
              currentQty: e.stockQty,
              actualQty: e.transferQty,
              finalQty: currentQty,
              type: "Stock Transfer",
              relatedBranch: relatedBranch,
              createdBy: createdBy,
            });
            gen = gen + parseInt(e.totalPrice);
          } catch (error) {
            generalItemsError.push(e);
          }
        }
      });
    }
    const totalPrice = pAcc + pMed + med + gen;
    console.log(pMed, pAcc, med, gen, totalPrice, "here it is");
    newBody = { ...newBody, totalPrice: totalPrice };
    console.log(newBody);
    const newStockTransfer = new StockTransfer(newBody);
    const result = await newStockTransfer.save();
    const stockRequestUpdate = await StockRequest.findOneAndUpdate(
      { _id: req.body.stockRequestID },
      { relatedTransfer: result._id },
      { new: true }
    );

    let response = { success: true, message: "StockTransfer create success" };
    if (procedureMedicineError.length > 0)
      response.procedureMedicineError = procedureMedicineError;
    if (medicineListsError.length > 0)
      response.medicineListsError = medicineListsError;
    if (procedureAccessoryError.length > 0)
      response.procedureAccessoryError = procedureAccessoryError;
    if (procedureMedicineFinished !== undefined)
      response.procedureMedicineFinished = procedureMedicineFinished;
    if (medicineListsFinished !== undefined)
      response.medicineListsFinished = medicineListsFinished;
    if (procedureAccessoryFinished !== undefined)
      response.procedureAccessoryFinished = procedureAccessoryFinished;
    if (generalItemsError.length > 0)
      response.generalItemsError = generalItemsError;
    if (generalItemsFinished !== undefined)
      response.generalItemsFinished = generalItemsFinished;
    if (fTransResult !== undefined) response.fTransResult = fTransResult;
    if (sTransResult !== undefined) response.sTransResult = sTransResult;
    response = { ...response, data: result };

    res.status(200).send(response);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.updateStockTransfer = async (req, res, next) => {
  try {
    const result = await StockTransfer.findOneAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true }
    ).populate(
      "procedureMedicine.item_id medicineLists.item_id procedureAccessory.item_id generalItems.item_id relatedBranch"
    );
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.deleteStockTransfer = async (req, res, next) => {
  try {
    const result = await StockTransfer.findOneAndUpdate(
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

exports.activateStockTransfer = async (req, res, next) => {
  try {
    const result = await StockTransfer.findOneAndUpdate(
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

exports.generateCode = async (req, res) => {
  let data;
  try {
    const latestDocument = await StockTransfer.find({}, { seq: 1 })
      .sort({ _id: -1 })
      .limit(1)
      .exec();
    console.log(latestDocument);
    if (latestDocument.length === 0)
      data = { ...data, seq: "1", patientID: "ST-1" }; // if seq is undefined set initial patientID and seq
    console.log(data);
    if (latestDocument.length) {
      const increment = latestDocument[0].seq + 1;
      data = { ...data, patientID: "ST-" + increment, seq: increment };
    }
    return res.status(200).send({
      success: true,
      data: data,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.filterStockTransfer = async (req, res, next) => {
  try {
    let query = req.mongoQuery;
    let { startDate, endDate, relatedBranch } = req.query;
    if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
    if (relatedBranch) query.relatedBranch = relatedBranch;
    if (Object.keys(query).length === 0)
      return res.status(404).send({
        error: true,
        message: "Please Specify A Query To Use This Function",
      });
    const result = await StockTransfer.find(query).populate(
      "procedureMedicine.item_id medicineLists.item_id procedureAccessory.item_id generalItems.item_id relatedBranch"
    );
    if (result.length === 0)
      return res.status(404).send({ error: true, message: "No Record Found!" });
    res.status(200).send({ success: true, data: result });
  } catch (err) {
    return res.status(500).send({ error: true, message: err.message });
  }
};

exports.fixStockTransfer = async (req, res) => {
  StockTransfer.find({})
    .populate("medicineLists.item_id")
    .then(function (items) {
      items.forEach(function (stock) {
        stock.totalPrice = 0;
        const MedicineListArray = stock.medicineLists;
        const procedureMedicineArray = stock.procedureMedicine;
        const procedureAccessory = stock.procedureAccessory;
        const generalItem = stock.generalItems;
        if (MedicineListArray && MedicineListArray.length != 0) {
          MedicineListArray.forEach((item) => {
            item.purchasePrice = parseInt(
              item.purchasePrice || item.item_id.purchasePrice || 0
            );
            item.totalPrice =
              (parseInt(
                item.purchasePrice || item.item_id.purchasePrice || 0
              ) || 0) * (parseInt(item.transferQty || 0) || 0);
            stock.totalPrice += item.totalPrice;
          });
        }
        if (procedureMedicineArray && procedureMedicineArray.length != 0) {
          procedureMedicineArray.forEach((item) => {
            item.purchasePrice = parseInt(
              item.purchasePrice || item.item_id.purchasePrice || 0
            );
            item.totalPrice =
              (parseInt(
                item.purchasePrice || item.item_id.purchasePrice || 0
              ) || 0) * (parseInt(item.transferQty || 0) || 0);
            stock.totalPrice += item.totalPrice;
          });
        }
        if (procedureAccessory && procedureAccessory.length != 0) {
          procedureAccessory.forEach((item) => {
            item.purchasePrice = parseInt(
              item.purchasePrice || item.item_id.purchasePrice || 0
            );
            item.totalPrice =
              (parseInt(
                item.purchasePrice || item.item_id.purchasePrice || 0
              ) || 0) * (parseInt(item.transferQty || 0) || 0);
            stock.totalPrice += item.totalPrice;
          });
        }
        if (generalItem && generalItem.length != 0) {
          generalItem.forEach((item) => {
            item.purchasePrice = parseInt(
              item.purchasePrice || item.item_id.purchasePrice || 0
            );
            item.totalPrice =
              (parseInt(
                item.purchasePrice || item.item_id.purchasePrice || 0
              ) || 0) * (parseInt(item.transferQty || 0) || 0);
            stock.totalPrice += item.totalPrice;
          });
        }
        stock.save();
      });
    });
  res.send({ success: true });
};

exports.createExcelExport = async (req, res) => {
  try {
    let query = { isDeleted: false };
    let { startDate, endDate, relatedBranch } = req.query;
    let stockTransferData = [];
    startDate && endDate
      ? (query.date = { $gte: new Date(startDate), $lt: new Date(endDate) })
      : startDate
      ? (query.date = { $gte: new Date(startDate), $lt: new Date(startDate) })
      : endDate
      ? (query.date = { $gte: new Date(endDate), $lt: new Date(endDate) })
      : "";
    relatedBranch ? (query.relatedBranch = relatedBranch) : "";
    const result = await StockTransfer.find(query).populate(
      "relatedBranch procedureMedicine.item_id medicineLists.item_id procedureAccessory.item_id generalItems.item_id"
    );
    result.map((datas) => {
      const { _doc, ...otherData } = datas;
      const {
        procedureMedicine,
        medicineLists,
        procedureAccessory,
        generalItems,
        ...other
      } = _doc;
      if (procedureMedicine.length > 0) {
        procedureMedicine.map((item, index) => {
          stockTransferData.push({ ...other, item: item });
          other.totalPrice = 0;
        });
      }
      if (medicineLists.length > 0) {
        medicineLists.map((item, index) => {
          stockTransferData.push({ ...other, item: item });
          other.totalPrice = 0;
        });
      }
      if (procedureAccessory.length > 0) {
        procedureAccessory.map((item, index) => {
          stockTransferData.push({ ...other, item: item });
          other.totalPrice = 0;
        });
      }
      if (generalItems.length > 0) {
        generalItems.map((item, index) => {
          stockTransferData.push({ ...other, item: item });
          other.totalPrice = 0;
        });
      }
    });
    res
      .status(200)
      .send({ success: true, stockTransferData: stockTransferData });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};
