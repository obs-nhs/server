import express from 'express';
import {getHospitals} from './controller.js';
import {populateShifts, refreshShifts} from '../generators/gen_shifts.js';
const router = express.Router();

router.get('/', getHospitals);

router.get('/refreshShifts', refreshShifts);

router.get('/populateShifts', populateShifts);

export default router;
