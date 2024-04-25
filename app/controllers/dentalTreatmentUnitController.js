'use strict';
const dentalTreatmentUnit = require('../models/dentalTreatmentUnit')
const moment = require("moment-timezone")

exports.listAllDentalTreatmentUnits = async (req, res) => {
  let { keyword, role, limit, skip } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 10; //limit
    skip = +skip || 0;
    let query = {isDeleted:false},
      regexKeyword;
    role ? (query['role'] = role.toUpperCase()) : '';
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, 'i'))
      : '';
    regexKeyword ? (query['name'] = regexKeyword) : '';
    let result = await dentalTreatmentUnit.find(query).populate('procedureMedicine');
    count = await dentalTreatmentUnit.find(query).count();
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

exports.getDentalTreatmentUnit = async (req, res) => {
  const result = await dentalTreatmentUnit.find({ _id: req.params.id,isDeleted:false }).populate('procedureMedicine');
  if (!result)
    return res.status(500).json({ error: true, message: 'No Record Found' });
  return res.status(200).send({ success: true, data: result });
};

exports.createDentalTreatmentUnit = async (req, res, next) => {
  let data = req.body;
  try {
    //prepare PT-ID
    const latestDocument =await dentalTreatmentUnit.find({},{seq:1}).sort({_id: -1}).limit(1).exec();
    if (!latestDocument[0].seq) data= {...data, seq:'1', patientTreatmentID:"PT-001"} // if seq is undefined set initial patientID and seq
    if (latestDocument[0].seq) {
      const increment = latestDocument[0].seq+1
      data = {...data, patientTreatmentID:"PT-"+increment, seq:increment}
    }
    const newTreatmentUnit = new dentalTreatmentUnit(data);
    const result = await newTreatmentUnit.save();
    res.status(200).send({
      message: 'Dental TreatmentUnit create success',
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).send({ "error": true, message: error.message })
  }
};

exports.updateDentalTreatmentUnit = async (req, res, next) => {
  try {
    req.body.editTime = moment().tz('Asia/Yangon').format('MMMM Do YYYY, h:mm:ss a')
    req.body.editPerson = req.credentials.id
    req.body.editEmail =  req.credentials.email
    const result = await dentalTreatmentUnit.findOneAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true },
    ).populate('procedureMedicine') ;
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};

exports.deleteDentalTreatmentUnit = async (req, res, next) => {
  try {
    req.body.deleteTime = moment().tz('Asia/Yangon').format('MMMM Do YYYY, h:mm:ss a')
    req.body.deletePerson = req.credentials.id
    req.body.deleteEmail =  req.credentials.email
    const result = await dentalTreatmentUnit.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true, ...req.body },
      { new: true },
    );
    return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })

  }
}

exports.activateDentalTreatmentUnit = async (req, res, next) => {
  try {
    const result = await dentalTreatmentUnit.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: false },
      { new: true },
    );
    return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};

