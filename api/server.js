import express from 'express';
import cors from 'cors';
import parser from 'body-parser';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import {scheduleJob} from 'node-schedule';

import router from './router.js';
import {dbLink} from '../utils/helpers.js';
import {populateShifts, refreshShifts} from '../generators/gen_shifts.js';

const app = express();

app.use(cors());
app.use(parser.json());
app.use(helmet());
app.use(compression());
app.use(router);

mongoose
  .connect(dbLink)
  .then(() => app.listen(process.env.port || 8800))
  .catch(error => {
    throw error;
  });

scheduleJob('* * 0 * * *', refreshShifts);
scheduleJob('* 0 * * * *', populateShifts);
