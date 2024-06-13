'use strict';
const TreatmentVoucher = require('../models/treatmentVoucher');
const Transaction = require('../models/transaction');
const Accounting = require('../models/accountingList');
const Patient = require('../models/patient');
const Stock = require('../models/stock');
const Log = require('../models/log');
const Debt = require('../models/debt');
const accountingList = require('../models/accountingList');
const TreatmentSelection = require('../models/treatmentSelection');
const Appointment = require('../models/appointment');

exports.combineMedicineSale = async (req, res) => {
    let data = req.body;
    let { treatmentSelectId, remark, relatedBank, relatedCash, msPaidAmount, bankType, medicineItems, id, relatedPatient } = req.body;
    let createdBy = req.credentials.id;
    let objID = ''
    console.log("1 ", data)
    //search combineSaleActive is true or false
    let queryCombineSaleActive = await TreatmentSelection.findById(
                                 treatmentSelectId
                                );
    
    //update combine sale active to true
    await TreatmentSelection.findByIdAndUpdate(treatmentSelectId,{combineSaleActive:true})
    // if(queryCombineSaleActive.combineSaleActive && queryCombineSaleActive.combineSaleActive == false)
    //   await TreatmentSelection.findByIdAndUpdate(
    //          treatmentSelectId,
    //          {combineSaleActive:true} 
    //         )
    
    const patientUpdate = await Patient.findOneAndUpdate(
        { _id: relatedPatient },
        { $inc: { conditionAmount: msPaidAmount || 0, conditionPurchaseFreq: 1, conditionPackageQty: 1 } },
        { new: true }
    )
    if (medicineItems !== undefined) {
        for (const e of medicineItems) {
            if (e.stock < e.qty) return res.status(500).send({ error: true, message: 'RequestedQty Cannot Be Greater Than StockQty!' })
            let totalUnit = e.stock - e.qty
            const result = await Stock.find({ relatedMedicineItems: e.item_id, relatedBranch: req.body.relatedBranch })
            if (result.length <= 0) return res.status(500).send({ error: true, message: 'Medicine Item Not Found!' })
            const from = result[0].fromUnit
            const to = result[0].toUnit
            const currentQty = (from * totalUnit) / to
            try {
                const result = await Stock.findOneAndUpdate(
                    { relatedMedicineItems: e.item_id, relatedBranch: req.body.relatedBranch },
                    { totalUnit: totalUnit, currentQty: currentQty },
                    { new: true },
                )
            } catch (error) {
                return res.status(500).send({ error: true, message: error.message })
            }
            const logResult = await Log.create({
                "relatedTreatmentSelection": null,
                "relatedAppointment": null,
                "relatedMedicineItems": e.item_id,
                "currentQty": e.stock,
                "actualQty": e.actual,
                "finalQty": totalUnit,
                "type": "Medicine Sale",
                "relatedBranch": req.body.relatedBranch,
                "createdBy": createdBy
            })
        }
    }
    if (req.body.secondAmount) {
        var fTransResult = await Transaction.create({
            "amount": req.body.secondAmount,
            "relatedBranch": req.body.relatedBranch,
            "date": Date.now(),
            "remark": remark || " ",
            "relatedAccounting": req.body.secondAccount,
            "type": "Credit",
            "createdBy": createdBy,
            "relatedBranch": req.mongoQuery.relatedBranch
        })
        const amountUpdates = await Accounting.findOneAndUpdate(
            { _id: req.body.secondAccount },
            { $inc: { amount: req.body.secondAmount } }
        )

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
    )
    if (req.body.balance > 0) {
        const debtCreate = await Debt.create({
            "balance": req.body.balance,
            "relatedPatient": data.relatedPatient,
            "relatedTreatmentVoucher": medicineSaleResult._id
        })
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
    )
    //sec transaction
    const secAmtTransaction = new Transaction(
        {
            "amount": req.body.msPaidAmount,
            "date": Date.now(),
            "remark": remark || " ",
            "relatedBank": req.body.relatedBank,
            "relatedCash": req.body.relatedCash,
            "type": "Debit",
            // "relatedTransaction": fTransResult._id,
            "createdBy": createdBy
        }
    )
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
        )
    } else if (req.body.relatedCash) {
        var amountUpdate = await Accounting.findOneAndUpdate(
            { _id: req.body.relatedCash },
            { $inc: { amount: req.body.msPaidAmount } }
        )
    }

    res.status(200).send({
        message: 'MedicineSale Combination success',
        success: true,
        data: medicineSaleResult
    });

}

exports.createSingleMedicineSale = async (req, res) => {
    try {
        let data = req.body;
        let objID = ''
        let {remark, relatedBank, relatedCash, medicineItems, relatedBranch } = req.body;
        let createdBy = req.credentials.id;
        if (medicineItems !== undefined) {
            for (const e of medicineItems) {
                console.log("medicine is ",e)
                if (e.stock < e.qty) return res.status(500).send({ error: true, message: 'RequestedQty Cannot Be Greater Than StockQty!' })
                const result = await Stock.find({ relatedMedicineItems: e.item_id, relatedBranch: req.body.relatedBranch }).populate("relatedMedicineItems")
                if (result.length <= 0) return res.status(500).send({ error: true, message: 'Medicine Item Not Found!' })
                console.log("reusl",result)
                let totalUnit = e.stock - e.qty
                const from = Number(result[0].fromUnit)
                const to = Number(result[0].toUnit)
                console.log("to is ",to)
                const currentQty = (from * totalUnit) / to
                console.log(totalUnit,currentQty)
                try {
                    const result = await Stock.findOneAndUpdate(
                        { relatedMedicineItems: e.item_id, relatedBranch: relatedBranch },
                        { totalUnit: totalUnit, currentQty: currentQty },
                        { new: true },
                    )
                } catch (error) {
                    return res.status(500).send({ error: true, message: error.message })
                }
                const logResult = await Log.create({
                    "relatedTreatmentSelection": null,
                    "relatedAppointment": null,
                    "relatedMedicineItems": e.item_id,
                    "currentQty": e.stock,
                    "actualQty": e.actual,
                    "finalQty": totalUnit,
                    "type": "Medicine Sale",
                    "relatedBranch": req.body.relatedBranch,
                    "createdBy": createdBy
                })
            }
        }
        if (req.body.secondAmount) {
            var fAmtTransResult = await Transaction.create({
                "amount": req.body.secondAmount,
                "relatedBranch": req.body.relatedBranch,
                "date": Date.now(),
                "remark": remark || " ",
                "relatedAccounting": req.body.secondAccount,
                "type": "Credit",
                "createdBy": createdBy,
                "relatedBranch": req.mongoQuery.relatedBranch
            })
            const amountUpdates = await Accounting.findOneAndUpdate(
                { _id: req.body.secondAccount },
                { $inc: { amount: req.body.secondAmount } }
            )

        }
        const medicineSaleResult = await TreatmentVoucher.create(data)
        console.log(medicineSaleResult._id)
        //Transaction
        const fTransaction = new Transaction({
            "amount": data.payAmount,
            "date": Date.now(),
            "remark": remark || " ",
            "relatedAccounting": "646739c059a9bc811d97fa8b", //Sales (Medicines),
            "relatedMedicineSale": medicineSaleResult._id,
            "type": "Credit",
            "createdBy": createdBy
        })
        const fTransResult = await fTransaction.save()

        var amountUpdate = await Accounting.findOneAndUpdate(
            { _id: "646739c059a9bc811d97fa8b" },
            { $inc: { amount: data.msPaidAmount } }
        )
        console.log('here')
        //sec transaction
        const secTransaction = new Transaction(
            {
                "amount": data.msPaidAmount,
                "date": Date.now(),
                "remark": remark || " ",
                "relatedBank": req.body.relatedBank,
                "relatedCash": req.body.relatedCash,
                "type": "Debit",
                "relatedTransaction": fTransResult._id,
                "createdBy": createdBy
            }
        )
        const secTransResult = await secTransaction.save();

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
                { $inc: { amount: data.msPaidAmount } }
            )
        } else if (req.body.relatedCash) {
            var amountUpdate = await Accounting.findOneAndUpdate(
                { _id: req.body.relatedCash },
                { $inc: { amount: data.msPaidAmount } }
            )
        }

        if (req.body.relatedBank) objID = req.body.relatedBank
        if (req.body.relatedCash) objID = req.body.relatedCash
        //transaction

        const acc = await Accounting.find({ _id: objID })

        const accResult = await Accounting.findOneAndUpdate(
            { _id: objID },
            { amount: parseInt(req.body.msPaidAmount) + parseInt(acc[0].amount) },
            { new: true },
        )

        const updateMedSale = await TreatmentVoucher.findOneAndUpdate({ _id: medicineSaleResult._id }, { relatedTransaction: [fTransResult._id, secTransResult._id], createdBy: createdBy, relatedBranch: req.body.relatedBranch }, { new: true })
        if (req.body.balance > 0) {
            const debtCreate = await Debt.create({
                "balance": req.body.balance,
                "relatedPatient": data.relatedPatient,
                "relatedTreatmentVoucher": medicineSaleResult._id
            })
            const fTransaction = new Transaction({
                "amount": req.body.balance,
                "date": Date.now(),
                "remark": remark || " ",
                "relatedAccounting": "6505692e8a572e8de464c0ea", //Account Receivable from Customer
                "type": "Debit",
                "createdBy": createdBy
            })
            const fTransResult = await fTransaction.save()
            var amountUpdate = await Accounting.findOneAndUpdate(
                { _id: "6505692e8a572e8de464c0ea" },  //Account Receivable from Customer
                { $inc: { amount: req.body.balance } }
            )

            const secTransaction = new Transaction(
                {
                    "amount": data.msPaidAmount,
                    "date": Date.now(),
                    "remark": remark || " ",
                    "relatedBank": relatedBank,
                    "relatedCash": relatedCash,
                    "type": "Debit",
                    "relatedTransaction": fTransResult._id,
                    "createdBy": createdBy
                }
            )
            const secTransResult = await secTransaction.save();
            var fTransUpdate = await Transaction.findOneAndUpdate(
                { _id: fTransResult._id },
                {
                    relatedTransaction: secTransResult._id
                },
                { new: true }
            )
            if (relatedBank) {
                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: relatedBank },
                    { $inc: { amount: req.body.msPaidAmount } }
                )
            } else if (relatedCash) {
                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: relatedCash },
                    { $inc: { amount: req.body.msPaidAmount } }
                )
            }
        }
        return res.status(200).send({
            message: 'MedicineSale Transaction success',
            success: true,
            data: updateMedSale
        });

    } catch (error) {
        console.log(error)
        return res.status(500).send({
            error: true,
            message: error.message
        });
    }
}

exports.getCodeMS = async (req, res) => {
    let data = {}
    try {
        let today = new Date().toISOString()
        const latestDocument = await TreatmentVoucher.find({ tsType: 'MS' }, { seq: 1 }).sort({ _id: -1 }).limit(1).exec();
        if (latestDocument.length === 0) data = { ...data, seq: 1, code: "MVC-" + today.split('T')[0].replace(/-/g, '') + "-1" } // if seq is undefined set initial patientID and seq
        if (latestDocument.length > 0) {
            const increment = ( latestDocument[0].seq || 0) + 1
           
            data = { ...data, code: "MVC-" + today.split('T')[0].replace(/-/g, '') + "-" + increment, seq: increment }
        }
        return res.status(200).send({ success: true, data: data })
    } catch (error) {
        return res.status(500).send({ "error": true, message: error.message })
    }
}

exports.listAllTreatmentVouchers = async (req, res) => {
    let { keyword, role, limit, skip } = req.query;
    let count = 0;
    let page = 0;
    try {
        limit = +limit <= 100 ? +limit : 20; //limit
        skip = +skip || 0;
        let query = req.mongoQuery,
            regexKeyword;
        role ? (query['role'] = role.toUpperCase()) : '';
        keyword && /\w/.test(keyword)
            ? (regexKeyword = new RegExp(keyword, 'i'))
            : '';
        regexKeyword ? (query['name'] = regexKeyword) : '';
        let result = await TreatmentVoucher.find(query).populate('createdBy relatedTreatment relatedAppointment relatedPatient payment relatedTreatmentSelection relatedBranch relatedRepay')
                            .populate({
                                path: "relatedTreatmentPackage",
                                populate:{
                                    path: "item_id"
                                }
                            })
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
    let query = req.mongoQuery
    if (req.params.id) query.relatedTreatmentSelection = req.params.id
    const result = await TreatmentVoucher.find(query).populate('createdBy relatedTreatment relatedAppointment relatedPatient relatedRepay')
                   .populate({
                        path: "relatedTreatmentPackage",
                        populate:{
                            path: "item_id"
                        }
                    })
    if (!result)
        return res.status(500).json({ error: true, message: 'No Record Found' });
    return res.status(200).send({ success: true, data: result });
};

exports.getTreatmentVoucher = async (req, res) => {
    let query = req.mongoQuery
    if (req.params.id) query._id = req.params.id
    const result = await TreatmentVoucher.find(query).populate('createdBy relatedTreatment relatedAppointment relatedPatient relatedTreatmentSelection medicineItems.item_id multiTreatment.item_id relatedDentalTreatmentSelection relatedPackage relatedPackageSelection relatedRepay')
                        .populate({
                            path: "multiDentalTreatment",
                            populate:{
                                path: "item_id"
                            }
                        })
                        .populate({
                            path: "relatedTreatmentPackage",
                            populate:{
                                path: "item_id"
                            }
                        }).populate({
                            path: "relatedTreatmentPackageSelection",
                            populate: [{
                                path: "relatedTreatmentSelection"
                            },{
                                path: "relatedTreatmentPackage"
                            }]
                        })
    if (!result)
        return res.status(500).json({ error: true, message: 'No Record Found' });
    return res.status(200).send({ success: true, data: result });
};

exports.getRelatedTreatmentVoucher = async (req, res) => {
    try {
        let query = req.mongoQuery;
        let { relatedPatient, relatedTreatment, start, end, treatmentSelection, createdBy, relatedBranch } = req.body
        if (start && end) query.createdAt = { $gte: start, $lte: end }
        if (relatedPatient) query.relatedPatient = relatedPatient
        if (relatedTreatment) query.relatedTreatment = relatedTreatment
        if (treatmentSelection) query.relatedTreatmentSelection = treatmentSelection
        if (createdBy) query.createdBy = createdBy
        if (relatedBranch) query.relatedBranch = relatedBranch
        const result = await TreatmentVoucher.find(query).populate('createdBy relatedTreatment relatedAppointment relatedPatient relatedTreatmentSelection  relatedRepay')
                            .populate({
                                path: "relatedTreatmentPackage",
                                populate:{
                                    path: "item_id"
                                }
                            })
        if (!result)
            return res.status(404).json({ error: true, message: 'No Record Found' });
        return res.status(200).send({ success: true, data: result });
    } catch (error) {
        return res.status(500).send({ error: true, message: 'An Error Occured While Fetching Related Treatment Vouchers' })
    }
};

exports.searchTreatmentVoucher = async (req, res, next) => {
    try {
        let query = req.mongoQuery
        let { search, relatedPatient } = req.body
        if (relatedPatient) query.relatedPatient = relatedPatient
        if (search) query.$text = { $search: search }
        const result = await TreatmentVoucher.find(query).populate('createdBy relatedTreatment relatedAppointment relatedPatient relatedTreatmentSelection relatedRepay')
                            .populate({
                                path: "relatedTreatmentPackage",
                                populate:{
                                    path: "item_id"
                                }
                            })
        if (result.length === 0) return res.status(404).send({ error: true, message: 'No Record Found!' })
        return res.status(200).send({ success: true, data: result })
    } catch (err) {
        return res.status(500).send({ error: true, message: err.message })
    }
}

exports.getCode = async (req, res) => {
    let data = {}
    try {
        let today = new Date().toISOString()
        console.log("data is ",today)
        const latestDocument = await TreatmentVoucher.find({}, { seq: 1 }).sort({ _id: -1 }).limit(1).exec();
        console.log("today split is ",today.split('T')[0].replace(/-/g, '')) 
        if (latestDocument.length === 0) data = { ...data, seq: 1, code: "TVC-" + today.split('T')[0].replace(/-/g, '') + "-1" } // if seq is undefined set initial patientID and seq
        if (latestDocument.length > 0) {
            const increment = ( latestDocument[0].seq || 0) + 1 
            data = { ...data, code: "TVC-" + today.split('T')[0].replace(/-/g, '') + "-" + increment, seq: increment }
        }
        return res.status(200).send({ success: true, data: data })
    } catch (error) {
        return res.status(500).send({ "error": true, message: error.message })
    }
}

exports.createTreatmentVoucher = async (req, res, next) => {
    let data = req.body;
    try {

        const newTreatmentVoucher = new TreatmentVoucher(data);
        const result = await newTreatmentVoucher.save();
        res.status(200).send({
            message: 'TreatmentVoucher create success',
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(500).send({ "error": true, message: error.message })
    }
};

exports.updateTreatmentVoucher = async (req, res, next) => {
    try {
        const result = await TreatmentVoucher.findOneAndUpdate(
            { _id: req.body.id },
            req.body,
            { new: true },
        ).populate('createdBy relatedTreatment relatedAppointment relatedPatient');
        return res.status(200).send({ success: true, data: result });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })
    }
};

exports.deleteTreatmentVoucher = async (req, res, next) => {
    try {
        const result = await TreatmentVoucher.findOneAndUpdate(
            { _id: req.params.id },
            { isDeleted: true },
            { new: true },
        );
        const transactionArr = result.relatedTransaction
        const treatmentSelect = result.relatedTreatmentSelection
        const appointment = result.relatedAppointment

        const deletedTransactions = await Transaction.updateMany(
            { _id: { $in: transactionArr }, isDeleted: false }, // Filter
            { $set: { isDeleted: true } } // Update
        );

        if (transactionArr) {
            for (const item of transactionArr) {
                const getItem = await TreatmentVoucher.findOne({ _id: item })
                if (!getItem) return res.status(200).send({ success: true, message: 'Not Found!' })
                if (getItem.relatedBank) {
                    const updateBank = accountingList.findOneAndUpdate({ _id: getItem.relatedBank }, { $inc: { amount: -getItem.amount } }, { new: true })
                }
                if (getItem.relatedCash) {
                    const updateCash = accountingList.findOneAndUpdate({ _id: getItem.relatedCash }, { $inc: { amount: -getItem.amount } }, { new: true })
                }
                if (getItem.relatedAccounting) {
                    const updateCash = accountingList.findOneAndUpdate({ _id: getItem.relatedAccounting }, { $inc: { amount: -getItem.amount } }, { new: true })
                }
            }
        }

        if (treatmentSelect) {
            for (const item of treatmentSelect) {

                const getItem = await TreatmentSelection.deleteMany({ _id: item })
                console.log(getItem)
                if (!getItem) return res.status(200).send({ success: true, message: 'Not Found!' })
            }
        }

        if (appointment) {
            const updateResult = await Appointment.deleteMany({ _id: appointment })
        }

        return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })

    }
}

exports.activateTreatmentVoucher = async (req, res, next) => {
    try {
        const result = await TreatmentVoucher.findOneAndUpdate(
            { _id: req.params.id },
            { isDeleted: false },
            { new: true },
        );
        return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })
    }
};

exports.filterTreatmentVoucher = async (req, res, next) => {
    try {
        let query = { isDeleted: false }
        let { startDate, endDate, relatedDoctor, relatedPatient } = req.query
        if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate }
        if (relatedDoctor) query.relatedDoctor = relatedDoctor
        if (relatedPatient) query.relatedPatient = relatedPatient
        if (Object.keys(query).length === 0) return res.status(404).send({ error: true, message: 'Please Specify A Query To Use This Function' })
        const result = await TreatmentVoucher.find(query).populate('createdBy relatedTreatment relatedAppointment relatedPatient payment relatedTreatmentSelection relatedBranch relatedRepay')
                            .populate({
                                path: "relatedTreatmentPackage",
                                populate:{
                                    path: "item_id"
                                }
                            })
        if (result.length === 0) return res.status(404).send({ error: true, message: "No Record Found!" })
        res.status(200).send({ success: true, data: result })
    } catch (err) {
        return res.status(500).send({ error: true, message: err.message })
    }
}

exports.getTodaysTreatmentVoucher = async (req, res) => {
    try {
        let query = req.mongoQuery
        var start = new Date();
        var end = new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        if (start && end) query.originalDate = { $gte: start, $lt: end }
        const result = await TreatmentVoucher.find(query).populate('createdBy relatedAppointment relatedPatient relatedRepay').populate({
            path: 'relatedTreatment',
            model: 'Treatments',
            populate: {
                path: 'treatmentName',
                model: 'TreatmentLists'
            }
        }).populate({
            path: "relatedTreatmentPackage",
            populate:{
                path: "item_id"
            }
        })
        if (result.length === 0) return res.status(404).json({ error: true, message: 'No Record Found!' })
        return res.status(200).send({ success: true, data: result })
    } catch (error) {
        return res.status(500).send({ error: true, message: error.message })
    }
}

exports.getwithExactDate = async (req, res) => {
    try {
        let { exact } = req.query;
        const date = new Date(exact);
        const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()); // Set start date to the beginning of the day
        const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1); // Set end date to the beginning of the next day
        let result = await TreatmentVoucher.find({ createdAt: { $gte: startDate, $lt: endDate } }).populate('createdBy relatedAppointment relatedPatient relatedCash relatedRepay').populate({
            path: 'relatedTreatment',
            model: 'Treatments',
            populate: {
                path: 'treatmentName',
                model: 'TreatmentLists'
            }
        }).populate({
            path: "relatedTreatmentPackage",
            populate:{
                path: "item_id"
            }
        })
        //.populate('createdBy relatedTreatment relatedAppointment relatedPatient');
        if (result.length <= 0) return res.status(404).send({ error: true, message: 'Not Found!' });
        return res.status(200).send({ success: true, data: result });
    } catch (error) {
        return res.status(500).send({ error: true, message: error.message });
    }
};

exports.TreatmentVoucherFilter = async (req, res) => {
    let secondBankAndCashAccount = {}
    let secondBankCashAmount = []
    let firstBankName = []
    let firstCashName = []
    let secondCashName=[]
    let query = { relatedBank: { $exists: true }, isDeleted: false }
    let response = {
        success: true,
        data: {}
    }
    try {
        const { startDate, endDate, createdBy, purchaseType, relatedDoctor, bankType, tsType, relatedPatient, bankID, relatedBranch, income } = req.query
        if (startDate && endDate) query.createdAt = { $gte: startDate, $lte: endDate }
        if (relatedPatient) query.relatedPatient = relatedPatient
        if (bankType) query.bankType = bankType
        if (createdBy) query.createdBy = createdBy
        if (tsType) query.tsType = tsType
        if (bankID) query.relatedBank = bankID
        if (purchaseType) query.purchaseType = purchaseType
        if (relatedDoctor) query.relatedDoctor = relatedDoctor
        if (relatedBranch) query.relatedBranch = relatedBranch
        let bankResult = await TreatmentVoucher.find({...query,Refund: false}).populate('medicineItems.item_id multiTreatment.item_id relatedTreatment relatedBranch relatedDoctor relatedBank relatedCash relatedPatient relatedTreatmentSelection relatedAccounting payment createdBy newTreatmentVoucherId relatedRepay').populate({
            path: 'relatedTreatmentSelection',
            model: 'TreatmentSelections',
            populate: {
                path: 'relatedAppointments',
                model: 'Appointments',
                populate: {
                    path: 'relatedDoctor',
                    model: 'Doctors'
                },
            } ,
            populate: {
                path: 'relatedTreatment',
                model: 'Treatments',
            } 
        }).populate({
            path:"secondAccount",
            model:"AccountingLists",
            populate: {
                path:"relatedHeader",
                model:"AccountHeaders"
            }
        }).populate({
            path: "relatedTreatmentPackage",
            populate:{
                path: "item_id"
            }
        })
        let allBankResult = await TreatmentVoucher.find(query).populate('medicineItems.item_id multiTreatment.item_id relatedTreatment relatedBranch relatedDoctor relatedBank relatedCash relatedPatient relatedTreatmentSelection relatedAccounting payment createdBy newTreatmentVoucherId relatedRepay').populate({
            path: 'relatedTreatmentSelection',
            model: 'TreatmentSelections',
            populate: {
                path: 'relatedAppointments',
                model: 'Appointments',
                populate: {
                    path: 'relatedDoctor',
                    model: 'Doctors'
                },
            } ,
            populate: {
                path: 'relatedTreatment',
                model: 'Treatments',
            } 
        }).populate({
            path:"secondAccount",
            model:"AccountingLists",
            populate: {
                path:"relatedHeader",
                model:"AccountHeaders"
            }
        }).populate({
            path: "relatedTreatmentPackage",
            populate:{
                path: "item_id"
            }
        })
        if (!bankID) {
            const { relatedBank, ...query2 } = query;
            query2.relatedCash = { $exists: true };
            if (startDate && endDate) query2.createdAt = { $gte: startDate, $lte: endDate }
            let cashResult = await TreatmentVoucher.find({...query2, Refund: false}).populate('newTreatmentVoucherId medicineItems.item_id multiTreatment.item_id relatedTreatment secondAccount relatedBranch relatedDoctor relatedBank relatedCash relatedPatient relatedTreatmentSelection relatedAccounting payment createdBy relatedRepay').populate({
                path: 'relatedTreatmentSelection',
                model: 'TreatmentSelections',
                populate: {
                    path: 'relatedAppointments',
                    model: 'Appointments',
                    populate: {
                        path: 'relatedDoctor',
                        model: 'Doctors'
                    }
                },
                populate: {
                    path: 'relatedTreatment',
                    model: 'Treatments',
                } 
            }).populate({
                path:"secondAccount",
                model:"AccountingLists",
                populate: {
                    path:"relatedHeader",
                    model:"AccountHeaders"
                }
            }).populate({
                path: "relatedTreatmentPackage",
                populate:{
                    path: "item_id"
                }
            })
            let allCashResult = await TreatmentVoucher.find(query2).populate('newTreatmentVoucherId medicineItems.item_id multiTreatment.item_id relatedTreatment secondAccount relatedBranch relatedDoctor relatedBank relatedCash relatedPatient relatedTreatmentSelection relatedAccounting payment createdBy relatedRepay').populate({
                path: 'relatedTreatmentSelection',
                model: 'TreatmentSelections',
                populate: {
                    path: 'relatedAppointments',
                    model: 'Appointments',
                    populate: {
                        path: 'relatedDoctor',
                        model: 'Doctors'
                    }
                },
                populate: {
                    path: 'relatedTreatment',
                    model: 'Treatments',
                } 
            }).populate({
                path: "relatedTreatmentPackage",
                populate:{
                    path: "item_id"
                }
            })
            // if(secondAccount && secondAccount.relatedHeader.name === "Cash At Bank" ){
            //     const {name} = secondAccount;
            //     result[name] = secondAmount;
                 
            //     }
            //query second Ammount account
            const CashNames = cashResult.reduce((result, { Refund,tsType, relatedCash, paidAmount, msPaidAmount, totalPaidAmount, psPaidAmount, secondAccount,secondAmount }) => {
             //   console.log("paymont ",paidAmount,msPaidAmount,totalPaidAmount,tsType,secondAccount, secondAmount)
         
             if(secondAccount && secondAccount.relatedHeader.name === "Cash At Bank" ){
                const bankName =secondAccount.name;
                secondBankCashAmount.push({bankname:bankName,amount:secondAmount})                
            } 
             if (relatedCash) {
                    const { name } = relatedCash;
                    result[name] = (result[name] || 0) + (paidAmount || 0) + (msPaidAmount || 0) + (totalPaidAmount || 0) + (psPaidAmount || 0);
                }    
                //console.log("result ", result)
                return result;
            }, {});   
            if(CashNames) {
                Object.keys(CashNames).forEach(key=> firstCashName.push({cashname:key, amount:CashNames[key]}) )    
            }
            const CashTotal = cashResult.reduce((total, sale) => total + (sale.paidAmount || 0) + (sale.msPaidAmount || 0) + (sale.totalPaidAmount || 0) + (sale.psPaidAmount || 0) 
            , 0);
            income ? response.data = { ...response.data,  CashNames: CashNames, CashTotal: CashTotal }
            : response.data = { ...response.data, CashList: allCashResult, CashNames: CashNames, CashTotal: CashTotal }
            
        }
        //filter solid beauty
        const BankNames = bankResult.reduce((result, { Refund, relatedBank,tsType, paidAmount, msPaidAmount, totalPaidAmount, psPaidAmount, secondAccount, secondAmount }) => {
  
            if(secondAccount && secondAccount.relatedHeader.name == "Cash In Hand"){
                let {name} = secondAccount;
                secondCashName.push({cashname:name, amount:secondAmount})
            }
            else  if(secondAccount && secondAccount.relatedHeader.name === "Cash At Bank" ){
                const bankName =secondAccount.name;
                secondBankCashAmount.push({bankname:bankName,amount:secondAmount})                
            } 
            if (relatedBank) {
                console.log("paymont ",paidAmount,msPaidAmount,totalPaidAmount,tsType)
                const { name } = relatedBank;
                result[name] = (result[name] || 0) + (paidAmount || 0) + (msPaidAmount || 0) + (totalPaidAmount || 0) + (psPaidAmount || 0);
            } return result;

        }, {});
        const BankTotal = bankResult.reduce((total, sale) => total + (sale.paidAmount || 0) + (sale.msPaidAmount || 0) + (sale.totalPaidAmount || 0) + (sale.psPaidAmount || 0), 0);
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
         const equalBankName = result.find(t => t.bankname === nextresult.bankname);
  
        if (equalBankName) {
            equalBankName.amount += nextresult.amount;
        } else {
        result.push({ bankname: nextresult.bankname, amount: nextresult.amount });
       }
  
         return result;
         }, []);
        
        //key.bankname == value.bankname ? {bankname:key.name,amount:key.amount+value.amount} : ""
        // console.log('equeal ',secondBank)
        // Object.keys(secondBankCashAmount).forEach(key=> BankNames[key] && secondBankAndCashAccount[key] ? BankNames[key] = BankNames[key] + secondBankAndCashAccount[key] : BankNames[key] = BankNames[key] || secondBankAndCashAccount[key] )
        //     //console.log("juis ",secondBankAndCashAccount[key], BankNames[key]))
            //
        
        if(BankNames){
            Object.keys(BankNames).forEach(key=> firstBankName.push({bankname:key, amount:BankNames[key]}) )    
        }
        income ? response.data = { ...response.data, firstBankNames:firstBankName, firstCashNames:firstCashName, secondBankNames:secondBank, secondCashNames:secondCashName, BankTotal: BankTotal }  
        : response.data = { ...response.data, BankList: allBankResult, firstBankNames:firstBankName, firstCashNames:firstCashName, secondBankNames:secondBank, secondCashNames:secondCashName, BankTotal: BankTotal }  
        
            //console.log("next second amount  ",secondBankCashAmount)
        console.log("respaonse ",BankNames)
        return res.status(200).send(response);
     } catch (error) {
        return res.status(500).send({ error: true, message: error.message })
    }
}

exports.createSpecificItemExcelForTreatmentVoucher = async (req, res) => {
    try{
        let query = { isDeleted: false, Refund: false }
        let { startDate, endDate, relatedBranch, createdBy, tsType } = req.query
        let medicineData = []
        let treatmentData = []
        startDate && endDate ? query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate)} :
        startDate ? query.createdAt = { $gte: new Date(startDate), $lte: new Date(startDate)} :
        endDate ? query.createdAt = { $gte: new Date(endDate), $lte: new Date(endDate)} : ""
        relatedBranch? query.relatedBranch = relatedBranch : ""
        createdBy? query.createdBy = createdBy : ""
        tsType? query.tsType = tsType : ""
        const result = await TreatmentVoucher.find(query).populate('medicineItems.item_id multiTreatment.item_id relatedTreatment secondAccount relatedBranch relatedDoctor relatedBank relatedCash relatedPatient relatedTreatmentSelection relatedAccounting payment createdBy relatedRepay')
        result.map(data=>{
         if(data.tsType === "MS"){
            if(data.medicineItems.length != 0){
                let { $__, $isNew, _doc} = data
                let { medicineItems, ...datas} = _doc
                medicineItems.map(medicineItem=>{
                    medicineData.push({...datas, item: medicineItem})
                })
            } 
         }
         if (data.tsType === "TSMulti"){
            if(data.multiTreatment.length != 0){
                let { $__, $isNew, _doc} = data
                let { multiTreatment, ...datas} = _doc
                multiTreatment.map(treatmentItem=>{
                    treatmentData.push({...datas, item: treatmentItem})
                })
            } 
         }
        })
        res.status(200).send({success: true, medicine: medicineData, treatment: treatmentData})
        
    }catch (error) {
        return res.status(500).send({ error: true, message: error.message })
    }
}