import express from 'express';
import {getHospitals} from './controller.js';
const router = express.Router();

router.get('/', getHospitals);

export default router;
