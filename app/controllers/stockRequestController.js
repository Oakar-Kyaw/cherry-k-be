'use strict';
const StockRequest = require('../models/stockRequest');

exports.listAllStockRequests = async (req, res) => {
    let { keyword, role, limit, skip, relatedBranch } = req.query;
    let count = 0;
    let page = 0;
    try {
        limit = +limit <= 100 ? +limit : 10; //limit
        skip = +skip || 0;
        let query = req.mongoQuery,
            regexKeyword;
        role ? (query['role'] = role.toUpperCase()) : '';
        relatedBranch ? query.relatedBranch = relatedBranch : ""
        keyword && /\w/.test(keyword)
            ? (regexKeyword = new RegExp(keyword, 'i'))
            : '';
        regexKeyword ? (query['name'] = regexKeyword) : '';
        const result = await StockRequest.find(query)

            .sort({ date: -1 })
            .populate({
                path: 'procedureMedicine.item_id medicineLists.item_id procedureAccessory.item_id generalItems.item_id relatedBranch',
            })
            .populate({
                path: 'relatedTransfer',
                model: 'StockTransfers',
                populate: [
                    { path: 'procedureMedicine.item_id', model: 'ProcedureItems' },
                    { path: 'medicineLists.item_id', model: 'MedicineItems' },
                    { path: "procedureAccessory.item_id", model: "AccessoryItems" },
                    { path: "generalItems.item_id", model: "GeneralItems" }
                ],
            }); count = await StockRequest.find(query).count();
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

exports.getStockRequest = async (req, res) => {
    let query = req.mongoQuery
    let { relatedBranch } = req.query
    if (req.params.id) query._id = req.params.id
    relatedBranch ? query.relatedBranch = relatedBranch : ""
    console.log("param ",query)
    const result = await StockRequest.find(query)
                         .populate([
                            { path:"relatedBranch"},
                            { path:"relatedTransfer", 
                              populate:[
                                { path:"procedureMedicine",populate:{path:"item_id"}},
                                { path:"generalItems",populate:{path:"item_id"}},
                                { path:"procedureMedicine",populate:{path:"item_id"}},
                                { path:"medicineLists",populate:{path:"item_id"}},
                                { path:"procedureAccessory",populate:{path:"item_id"}},
                            ]
                            },
                            { path:"generalItems",populate:{path:"item_id"}},
                            { path:"procedureMedicine",populate:{path:"item_id"}},
                            { path:"medicineLists",populate:{path:"item_id"}},
                            { path:"procedureAccessory",populate:{path:"item_id"}},
                        ])
    if (result.length === 0)
        return res.status(500).json({ error: true, message: 'No Record Found' });
    return res.status(200).send({ success: true, data: result });
};

exports.createStockRequest = async (req, res, next) => {
    let newBody = req.body;

    try {
        const newStockRequest = new StockRequest(newBody);
        const result = await newStockRequest.save();
        res.status(200).send({
            message: 'StockRequest create success',
            success: true,
            data: result
        });
    } catch (error) {
        // console.log(error )
        return res.status(500).send({ "error": true, message: error.message })
    }
};

exports.updateStockRequest = async (req, res, next) => {
    try {
        const result = await StockRequest.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
            { new: true },
        ) .populate([
            { path:"relatedBranch"},
            { path:"relatedTransfer"},
            { path:"generalItems",populate:{path:"item_id"}},
            { path:"procedureMedicine",populate:{path:"item_id"}},
            { path:"medicineLists",populate:{path:"item_id"}},
            { path:"procedureAccessory",populate:{path:"item_id"}},
        ])
            return res.status(200).send({ success: true, data: result });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })
    }
};

exports.deleteStockRequest = async (req, res, next) => {
    try {
        const result = await StockRequest.findOneAndUpdate(
            { _id: req.params.id },
            { isDeleted: true },
            { new: true },
        );
        return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })

    }
}

exports.activateStockRequest = async (req, res, next) => {
    try {
        const result = await StockRequest.findOneAndUpdate(
            { _id: req.params.id },
            { isDeleted: false },
            { new: true },
        );
        return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })
    }
};

exports.generateBranchRequestCode = async (req, res) => {
    try {
        let data;
        const query = req.mongoQuery;
        query.relatedBranch = req.params.id;
        //    query.branchRequestNumber = 1
        const latestDocument = await StockRequest.find(query, { branchRequestNumber: 1 }).sort({ _id: -1 }).limit(1).exec();
        console.log("late ", latestDocument)
        if (latestDocument.length === 0) {
            data = { ...data, branchRequestCode: "BSR" + " - " + " - " + "1", branchRequestNumber: 1 }

        }
        else {

            let increment = latestDocument[0].branchRequestNumber + 1;
            console.log("increment is  ", latestDocument[0])
            data = { ...data, branchRequestCode: "BSR" + " - " + " - " + increment, branchRequestNumber: increment }
        }
        return res.status(200).send({
            success: true,
            data: data
        })
    } catch (error) {
        return res.status(500).send({ error: true, message: error.message })
    }
}

exports.generateCode = async (req, res) => {
    let data;
    try {
        const latestDocument = await StockRequest.find({}, { seq: 1 }).sort({ _id: -1 }).limit(1).exec();
        console.log(latestDocument)
        if (latestDocument.length === 0) data = { ...data, seq: '1', patientID: "SR-1" } // if seq is undefined set initial patientID and seq
        console.log(data)
        if (latestDocument.length) {
            const increment = latestDocument[0].seq + 1
            data = { ...data, patientID: "SR-" + increment, seq: increment }
        }
        return res.status(200).send({
            success: true,
            data: data
        })
    } catch (error) {
        return res.status(500).send({ error: true, message: error.message })
    }
}

exports.filterStockRequest = async (req, res, next) => {
    try {
        let query = req.mongoQuery
        let { startDate, endDate, relatedBranch } = req.query
        if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate }
        if (relatedBranch) query.relatedBranch = relatedBranch
        if (Object.keys(query).length === 0) return res.status(404).send({ error: true, message: 'Please Specify A Query To Use This Function' })
        const result = await StockRequest.find(query).populate('procedureMedicine.item_id generalItems.item_id medicineLists.item_id procedureAccessory.item_id relatedBranch');
        if (result.length === 0) return res.status(404).send({ error: true, message: "No Record Found!" })
        res.status(200).send({ success: true, data: result })
    } catch (err) {
        return res.status(500).send({ error: true, message: err.message })
    }

}
