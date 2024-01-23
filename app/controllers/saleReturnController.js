'use strict';
const SaleReturn = require('../models/saleReturn');
const TreatmentSelection = require('../models/treatmentSelection');
const TreatmentVoucher = require('../models/treatmentVoucher');
const Transaction = require('../models/transaction');
const Accounting = require('../models/accountingList');

exports.listAllSaleReturns = async (req, res) => {
    let { keyword, role, limit, skip } = req.query;
    let count = 0;
    let page = 0;
    try {
        limit = +limit <= 100 ? +limit : 10; //limit
        skip = +skip || 0;
        let query = req.mongoQuery,
            regexKeyword;
        role ? (query['role'] = role.toUpperCase()) : '';
        keyword && /\w/.test(keyword)
            ? (regexKeyword = new RegExp(keyword, 'i'))
            : '';
        regexKeyword ? (query['name'] = regexKeyword) : '';
        const result = await SaleReturn.find(query)
            .populate('relatedBranch relatedTreatmentVoucher relatedAppointment relatedPatient')
            .populate({
                path: 'relatedTreatmentSelection',
                populate: [{
                    path: 'relatedTreatment',
                    model: 'Treatments',
                    populate: {
                        path: 'treatmentName',
                        model: 'TreatmentLists'
                    }
                }]
            })
            .populate({
                path: 'relatedSubTreatment',
                populate: [{
                    path: 'relatedTreatment',
                    model: 'Treatments'
                }]
            });

        count = await SaleReturn.find(query).count();
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

exports.getSaleReturn = async (req, res) => {
    let query = req.mongoQuery
    if (req.params.id) query._id = req.params.id
    const result = await SaleReturn.find(query).populate('relatedBranch relatedPatient relatedTreatmentSelection relatedTreatmentVoucher relatedAppointment relatedSubTreatment')
    if (result.length === 0)
        return res.status(500).json({ error: true, message: 'No Record Found' });
    return res.status(200).send({ success: true, data: result });
};

exports.createSaleReturn = async (req, res, next) => {
    let newBody = req.body;
    let createdBy = req.credentials.id
    let { relatedTreatmentSelection, relatedSubTreatment, returnType, deferAmount, relatedBank, relatedCash, paidAmount, totalAmount, cashBack } = req.body;
    try {
        const TSResult = await TreatmentSelection.find({ _id: relatedTreatmentSelection }).populate('relatedTreatment')
        if (returnType === 'Full Cash' && relatedTreatmentSelection) {
            var selecUpdate = await TreatmentSelection.findOneAndUpdate(
                { _id: relatedTreatmentSelection },
                { saleReturnFlag: true },
                { new: true }
            )
            if (cashBack > 0) {
                //649a4fbd23608d77fb20afb6
                var fTransResult = await Transaction.create({
                    "amount": cashBack,
                    "date": Date.now(),
                    "remark": null,
                    "relatedAccounting": "649a4fbd23608d77fb20afb6", //Sales Cash Back
                    "type": "Debit",
                    "createdBy": createdBy
                })
                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: "649a4fbd23608d77fb20afb6" },  //Sales Cash Back
                    { $inc: { amount: cashBack } }
                )
                //sec transaction
                var secTransResult = await Transaction.create({
                    "amount": cashBack,
                    "date": Date.now(),
                    "remark": null,
                    "relatedBank": req.body.relatedBank,
                    "relatedCash": req.body.relatedCash,
                    "type": "Credit",
                    "relatedTransaction": fTransResult._id,
                    "createdBy": createdBy
                });
                var fTransUpdate = await Transaction.findOneAndUpdate(
                    { _id: fTransResult._id },
                    {
                        relatedTransaction: secTransResult._id
                    },
                    { new: true }
                )
                if (req.body.relatedBank) {
                    var amountUpdate = await Accounting.findOneAndUpdate(
                        { _id: req.body.relatedBank },
                        { $inc: { amount: -cashBack } }
                    )
                } else if (req.body.relatedCash) {
                    var amountUpdate = await Accounting.findOneAndUpdate(
                        { _id: req.body.relatedCash },
                        { $inc: { amount: -cashBack } }
                    )
                }
                // new expense acc(Debit) PLUS - fTrans (cashBack)
                //     Bank or cash(credit) MINUS - secTrans (cashBack)
                //----------------------------------------------------------
            }
        }
        else if (returnType === 'SubTreatment' && relatedSubTreatment) {
            var selecUpdate = await TreatmentSelection.findOneAndUpdate(
                { _id: relatedTreatmentSelection },
                { saleReturnFlag: true },
                { new: true }
            );
            if (cashBack > 0) {
                var fTransResult = await Transaction.create({
                    "amount": cashBack,
                    "date": Date.now(),
                    "remark": null,
                    "relatedAccounting": "649a4fbd23608d77fb20afb6", //Sales Cash Back
                    "type": "Debit",
                    "createdBy": createdBy
                })
                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: "649a4fbd23608d77fb20afb6" },  //Sales Cash Back
                    { $inc: { amount: cashBack } }
                )
                //sec transaction
                var secTransResult = await Transaction.create({
                    "amount": cashBack,
                    "date": Date.now(),
                    "remark": null,
                    "relatedBank": req.body.relatedBank,
                    "relatedCash": req.body.relatedCash,
                    "type": "Credit",
                    "relatedTransaction": fTransResult._id,
                    "createdBy": createdBy
                });
                var fTransUpdate = await Transaction.findOneAndUpdate(
                    { _id: fTransResult._id },
                    {
                        relatedTransaction: secTransResult._id
                    },
                    { new: true }
                )
                if (req.body.relatedBank) {
                    var amountUpdate = await Accounting.findOneAndUpdate(
                        { _id: req.body.relatedBank },
                        { $inc: { amount: -cashBack } }
                    )
                } else if (req.body.relatedCash) {
                    var amountUpdate = await Accounting.findOneAndUpdate(
                        { _id: req.body.relatedCash },
                        { $inc: { amount: -cashBack } }
                    )
                }
                //cashback for extra amount
                // new expense acc (Debit) PLUS - ftrans (cashBack)
                // bank/cash (Credit) MINUS -sTrans (cashBack)
                //----------------------------------------------------------
            }

        }
        var thirdTransResult = await Transaction.create({
            "amount": totalAmount,
            "date": Date.now(),
            "remark": null,
            "relatedAccounting": TSResult[0].relatedTreatment.relatedAccount, //relatedTreamentSelection.relatedTreatment.relatedAccount 
            "type": "Debit",
            "createdBy": req.credentials.id
        })
        var amountUpdate = await Accounting.findOneAndUpdate(
            { _id: TSResult[0].relatedTreatment.relatedAccount },  //relatedTreamentSelection.relatedTreatment.relatedAccount 
            { $inc: { amount: -totalAmount } }
        )
        const newSaleReturn = new SaleReturn(newBody);
        const result = await newSaleReturn.save();

        res.status(200).send({
            message: 'SaleReturn create success',
            success: true,
            data: result,
            selecUpdate: selecUpdate
        });
    } catch (error) {
        // console.log(error )
        return res.status(500).send({ "error": true, message: error.message })
    }
};

exports.updateSaleReturn = async (req, res, next) => {
    try {
        const result = await SaleReturn.findOneAndUpdate(
            { _id: req.body.id },
            req.body,
            { new: true },
        ).populate('relatedBranch relatedPatient relatedTreatmentSelection relatedTreatmentVoucher relatedAppointment relatedSubTreatment')
        return res.status(200).send({ success: true, data: result });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })
    }
};

exports.deleteSaleReturn = async (req, res, next) => {
    try {
        const result = await SaleReturn.findOneAndUpdate(
            { _id: req.params.id },
            { isDeleted: true },
            { new: true },
        );
        return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })

    }
}

exports.activateSaleReturn = async (req, res, next) => {
    try {
        const result = await SaleReturn.findOneAndUpdate(
            { _id: req.params.id },
            { isDeleted: false },
            { new: true },
        );
        return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })
    }
};
