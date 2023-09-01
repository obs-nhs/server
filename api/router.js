import express from 'express';
import {getHospitals, transferPatient, dischargePatient} from './controller.js';
const router = express.Router();

router.get('/', getHospitals);
router.put('/transfer', transferPatient);
router.put('/discharge', dischargePatient);

export default router;
