'use strict';
const Repayment = require('../models/repayment');
const PatientTreatment = require('../models/patientTreatment');
const Transaction = require('../models/transaction');
const RepayRecord = require('../models/repayRecord');

exports.listAllRepayments = async (req, res) => {
  let { keyword, role, limit, skip, relatedDebt, relatedPatient, relatedBranch } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 20; //limit
    skip = +skip || 0;
    let query = { isDeleted: false },
      regexKeyword;
    role ? (query['role'] = role.toUpperCase()) : '';
    relatedDebt ? query["relatedDebt"] = relatedDebt : ""
    relatedPatient ? query["relatedPatient"] = relatedPatient : ""
    relatedBranch ? query["relatedBranch"] = relatedBranch : ""
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, 'i'))
      : '';
    regexKeyword ? (query['name'] = regexKeyword) : '';
    let result = await Repayment.find(query).populate('relatedTreatmentVoucher relatedDebt relatedBank relatedCash relatedBranch relatedPatient');
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
  const result = await Repayment.find({ _id: req.params.id, isDeleted: false }).populate('relatedTreatmentVoucher relatedDebt relatedBank relatedCash relatedBranch')
  if (!result)
    return res.status(500).json({ error: true, message: 'No Record Found' });
  return res.status(200).send({ success: true, data: result });
};



exports.createRepayment = async (req, res, next) => {
  let data = req.body;
  try {
    const newBody = data;
    const newRepayment = new Repayment(newBody);
    const result = await newRepayment.save();

    res.status(200).send({
      message: 'Repayment create success',
      success: true,
      data: result,
      patientTreatment: patientTreatmentResults,
      fTrans: fTransUpdate,
      sTrans: secTransResult
    });
  } catch (error) {
    // console.log(error )
    return res.status(500).send({ "error": true, message: error.message })
  }
};

exports.updateRepayment = async (req, res, next) => {
  try {
    const result = await Repayment.findOneAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true },
    ).populate('relatedTreatmentVoucher relatedDebt relatedBank relatedCash relatedBranch relatedPatient');
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};

exports.deleteRepayment = async (req, res, next) => {
  try {
    const today = new Date()
    const deleteDay = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
      today.getHours(),
      today.getMinutes(),
      today.getSeconds()
    )
    const result = await Repayment.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true, expireAt: deleteDay },
      { new: true },
    );
    return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })

  }
}

exports.activateRepayment = async (req, res, next) => {
  try {
    const result = await Repayment.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: false },
      { new: true },
    );
    return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};

exports.getRepayRecord = async (req, res) => {
  try {
    const result = await RepayRecord.find({ relatedTreatmentSelection: req.params.id }).populate('relatedAppointment relatedBranch').populate({
      path: 'relatedTreatmentSelection',
      model: 'TreatmentSelections',
      populate: {
        path: 'relatedTreatment',
        model: 'Treatments'
      }
    })
    if (result.length === 0) return res.status(404).send({ error: true, message: 'No Records Found!' })
    return res.status(200).send({ success: true, data: result })
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message })
  }
}
