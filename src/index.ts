import express, {Request, Response} from 'express';
import dotenv from 'dotenv';
import { env } from './config/env.js';

import authRoutes from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger.js';
import { httpLogger } from './middlewares/httpLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = env.PORT;

app.use(httpLogger);
app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authRoutes);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: "Success",
      message: "Server is healthy"
    })
})

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});