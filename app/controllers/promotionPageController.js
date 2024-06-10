const promotionPage = require("../models/promotionPage");

class PromotionPageController { // create promotion page datas
    async create(req, res) {
        try {
            if (req.file) {
                req.body.image = "cherry-k/promotions/" + req.file.filename
            }
            let result = await promotionPage.create(req.body)
            res.status(200).send({success: true, message: "Created Promotion Page Successfully.", data: result})
        } catch (err) {
            res.status(500).send({error: true, message: err.message})
        }
    }
    // read all promotion page datas
    async read(req, res) {
        try {
            let query = {
                isDeleted: false
            }
            let result = await promotionPage.find(query)
            res.status(200).send({success: true, message: "Read Promotion Page Successfully.", data: result})
        } catch (err) {
            res.status(500).send({error: true, message: err.message})
        }
    }
    // read all promotion page by id
    async readById(req, res) {
        try {
            let result = await promotionPage.findById(req.params.id)
            res.status(200).send({success: true, message: "Read Promotion Page By Id Successfully.", data: result})
        } catch (err) {
            res.status(500).send({error: true, message: err.message})
        }
    }
    // update all promotion page datas
    async update(req, res) {
        try {
            if (req.file) {
                req.body.image = "cherry-k/promotions/" + req.file.filename
            }
            let result = await promotionPage.findByIdAndUpdate(req.params.id, req.body, {new: true})
            res.status(200).send({success: true, message: "Updated Promotion Page By Id Successfully.", data: result})
        } catch (err) {
            res.status(500).send({error: true, message: err.message})
        }
    }
    // delete all promotion page datas
    async delete(req, res) {
        try {
            let result = await promotionPage.findByIdAndUpdate(req.params.id, {
                isDeleted: true
            }, {new: true})
            res.status(200).send({success: true, message: "Deleted Promotion Page By Id Successfully.", data: result})
        } catch (err) {
            res.status(500).send({error: true, message: err.message})
        }
    }
}

module.exports = PromotionPageController;
