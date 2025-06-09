const express = require('express');
const router = express.Router();
const { getCompanyStatutoryDeductions }  = require('../controllers/StatutoryController');

router.get('/company', getCompanyStatutoryDeductions);

module.exports = router;