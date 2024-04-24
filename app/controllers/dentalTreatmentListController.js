'use strict';
const dentalTreatmentList = require('../models/dentalTreatmentList');
const Treatment = require('../models/treatment');
const moment = require("moment")

exports.listAllDentalTreatmentLists = async (req, res) => {
  let { keyword, role, limit, skip } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 10; //limit
    skip = +skip || 0;
    let query = { isDeleted: false },
      regexKeyword;
    role ? (query['role'] = role.toUpperCase()) : '';
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, 'i'))
      : '';
    regexKeyword ? (query['name'] = regexKeyword) : '';
    let result = await dentalTreatmentList.find(query)
    count = await dentalTreatmentList.find(query).count();
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
    //console.log(e)
    return res.status(500).send({ error: true, message: e.message });
  }
};

exports.getDentalTreatmentList = async (req, res) => {
  const result = await dentalTreatmentList.find({ _id: req.params.id, isDeleted: false })
  if (!result)
    return res.status(500).json({ error: true, message: 'No Record Found' });
  return res.status(200).send({ success: true, data: result });
};

exports.getRelatedDentalTreatments = async (req, res) => {
  // .populate('treatmentName relatedDoctor relatedTherapist procedureMedicine.item_id medicineLists.item_id procedureAccessory.item_id machine.item_id relatedPatient relatedAppointment')
  const result = await dentalTreatmentList.find({ treatmentName: req.params.id })
  if (result.length === 0) return res.status(404).send({ error: true, message: "No Record Found" });
  return res.status(200).send({ success: true, data: result });
}

exports.createDentalTreatmentList = async (req, res) => {
  try {
    console.log("this ")
    const result = await dentalTreatmentList.create(req.body);
    console.log("that")
    res.status(200).send({
      message: 'Dental TreatmentList create success',
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).send({ "error": true, message: error.message })
  }
};

exports.updateDentalTreatmentList = async (req, res, next) => {
  try {
    req.body.editTime = moment().format('MMMM Do YYYY, h:mm:ss a')
    req.body.editPerson = req.credentials.id
    req.body.editEmail =  req.credentials.email
    const result = await dentalTreatmentList.findOneAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true },
    );
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};

exports.deleteDentalTreatmentList = async (req, res, next) => {
  try {
    req.body.deleteTime = moment().format('MMMM Do YYYY, h:mm:ss a')
    req.body.deletePerson = req.credentials.id
    req.body.deleteEmail =  req.credentials.email
    const result = await dentalTreatmentList.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true, ...req.body },
      { new: true },
    );
    return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })

  }
}

exports.activateDentalTreatmentList = async (req, res, next) => {
  try {
    const result = await dentalTreatmentList.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: false },
      { new: true },
    );
    return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};

exports.filterDentalTreatmentLists = async (req, res, next) => {
  try {
    let query = {}
    const { name, code } = req.query
    if (name) query.name = name
    if (code) query.code = code
    if (Object.keys(query).length === 0) return res.status(404).send({ error: true, message: 'Please Specify A Query To Use This Function' })
    const result = await denatlTreatmentList.find(query)
    if (result.length === 0) return res.status(404).send({ error: true, message: "No Record Found!" })
    res.status(200).send({ success: true, data: result })
  } catch (err) {
    return res.status(500).send({ error: true, message: err.message })
  }
}

exports.searchDentalTreatmentLists = async (req, res, next) => {
  try {
    const result = await dentalTreatmentList.find({ $text: { $search: req.query.search } })
    if (result.length === 0) return res.status(404).send({ error: true, message: 'No Record Found!' })
    return res.status(200).send({ success: true, data: result })
  } catch (err) {
    return res.status(500).send({ error: true, message: err.message })
  }
}

