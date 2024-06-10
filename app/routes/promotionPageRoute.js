"use strict";

const promotionPageController = require("../controllers/promotionPageController");
const {catchError} = require("../lib/errorHandler");
const upload = require("../lib/fieldUploader");
const verifyToken = require('../lib/verifyToken');

module.exports = (app) => {
    let promotionPage = new promotionPageController()
    app.route('/api/promotion-pages').post(upload.single("promotions"), catchError(promotionPage.create)).get(catchError(promotionPage.read))
    app.route('/api/promotion-page/:id').get(catchError(promotionPage.readById)).put(upload.single("promotions"), catchError(promotionPage.update)).delete(catchError(promotionPage.delete))
};
