"use strict";

const promotionPageController = require("../controllers/promotionPageController");
const {catchError} = require("../lib/errorHandler");
const upload = require("../lib/fieldUploader");
const verifyToken = require('../lib/verifyToken');

module.exports = (app) => {
    let promotionPage = new promotionPageController()
    app.route('/api/promotion-pages').post(verifyToken, upload.single("promotions"), catchError(promotionPage.create)).get(verifyToken, catchError(promotionPage.read))
    app.route('/api/promotion-page/:id').get(verifyToken, catchError(promotionPage.readById)).put(verifyToken, upload.single("promotions"), catchError(promotionPage.update)).delete(verifyToken, catchError(promotionPage.delete))
};
