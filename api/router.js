import express from 'express';
import {getHospitals, refresh, populate} from './controller.js';
const router = express.Router();

router.get('/', getHospitals);

router.get('/refreshShifts', refresh);

router.get('/populateShifts', populate);

export default router;
