import express from 'express';
import cors from 'cors';
import parser from 'body-parser';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';

import router from './router.js';
import {dbLink, errorPrompt} from '../utils/helpers.js';

const app = express();

app.use(cors());
app.use(parser.json());
app.use(helmet());
app.use(compression());
app.use(router);

mongoose
  .connect(dbLink)
  .then(() => app.listen(process.env.port || 3000))
  .catch(error => {
    throw error;
  });
