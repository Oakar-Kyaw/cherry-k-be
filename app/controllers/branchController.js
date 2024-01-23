'use strict';
const Branch = require('../models/branch');

exports.listAllBranches = async (req, res) => {
  let { keyword, role, limit, skip } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 10; //limit
    skip = +skip || 0;
    let query = {},
      regexKeyword;
    role ? (query['role'] = role.toUpperCase()) : '';
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, 'i'))
      : '';
    regexKeyword ? (query['name'] = regexKeyword) : '';
    let result = await Branch.find(query)
    count = await Branch.find(query).count();
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

exports.getBranch = async (req, res) => {
  const result = await Branch.find({ _id: req.params.id,isDeleted:false }).populate('procedureMedicine.item_id medicineLists.item_id procedureAccessory.item_id relatedBranch')
  if (result.length === 0)
    return res.status(500).json({ error: true, message: 'No Record Found' });
  return res.status(200).send({ success: true, data: result });
};

exports.createBranch = async (req, res, next) => {
  let newBody = req.body;
  try {
    const newBranch = new Branch(newBody);
    const result = await newBranch.save();
    res.status(200).send({
      message: 'Branch create success',
      success: true,
      data: result
    });
  } catch (error) {
    // console.log(error )
    return res.status(500).send({ "error": true, message: error.message })
  }
};

exports.updateBranch = async (req, res, next) => {
  try {
    const result = await Branch.findOneAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true },
    ).populate('procedureMedicine.item_id medicineLists.item_id procedureAccessory.item_id relatedBranch')
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};

exports.deleteBranch = async (req, res, next) => {
  try {
    const result = await Branch.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true },
      { new: true },
    );
    return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })

  }
}

exports.activateBranch = async (req, res, next) => {
  try {
    const result = await Branch.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: false },
      { new: true },
    );
    return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};
