'use strict';
const SellEnd = require('../models/sellend');
const Transaction = require('../models/transaction');
const Treatment = require('../models/treatment');

exports.listAllSellEnds = async (req, res) => {
  let { keyword, role, limit, skip } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 20; //limit
    skip = +skip || 0;
    let query = { isDeleted: false },
      regexKeyword;
    role ? (query['role'] = role.toUpperCase()) : '';
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, 'i'))
      : '';
    regexKeyword ? (query['name'] = regexKeyword) : '';
    let result = await SellEnd.find(query)
    count = await SellEnd.find(query).count();
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

exports.getSellEnd = async (req, res) => {
  const result = await SellEnd.find({ _id: req.params.id, isDeleted: false })
  if (!result)
    return res.status(500).json({ error: true, message: 'No Record Found' });
  return res.status(200).send({ success: true, data: result });
};

exports.createSellEnd = async (req, res, next) => {
  try {
    const newBody = req.body;
    const newSellEnd = new SellEnd(newBody);
    const result = await newSellEnd.save();
    const updateManyResult = await Treatment.updateMany(
      { "machine.item_id": relatedFixedAsset },
      { $set: { sellEndFlag: true } }
    )
    const firstTransaction =
    {
      "amount": newBody.profitAndLoss,
      "date": newBody.sellDate || newBody.endDate,
      "remark": newBody.remark,
      "type": "Credit",
      "relatedTransaction": null,
      "relatedAccounting": newBody.relatedAccounting
    }
    const fTransaction = new Transaction(firstTransaction)
    const fTransResult = await fTransaction.save();
    const secondTransaction = {
      "amount": newBody.profitAndLoss,
      "date": newBody.sellDate || newBody.endDate,
      "remark": newBody.remark,
      "type": "Debit",
      "relatedTransaction": fTransResult._id,
      "relatedAccounting": newBody.relatedAccounting,
    }
    const secTrans = new Transaction(secondTransaction)
    var secTransResult = await secTrans.save();
    var fTransUpdate = await Transaction.findOneAndUpdate(
      { _id: fTransResult._id },
      {
        relatedTransaction: secTransResult._id
      },
      { new: true }
    )

    res.status(200).send({
      message: 'SellEnd create success',
      success: true,
      data: result,
      fTransaction: fTransUpdate,
      secondTransaction: secTransResult
    });

  } catch (error) {
    //console.log(error)
    return res.status(500).send({ "error": true, message: error.message })
  }
};

exports.updateSellEnd = async (req, res, next) => {
  try {
    const result = await SellEnd.findOneAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true },
    )
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};

exports.deleteSellEnd = async (req, res, next) => {
  try {
    const result = await SellEnd.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true },
      { new: true },
    );
    return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })

  }
}

exports.activateSellEnd = async (req, res, next) => {
  try {
    const result = await SellEnd.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: false },
      { new: true },
    );
    return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};
