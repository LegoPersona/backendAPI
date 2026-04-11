"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Define your routes here
// Example: router.get('/example', exampleController);
exports.default = (app) => {
    app.use('/api', router);
};
