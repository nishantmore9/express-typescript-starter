import express, {Request, Response} from 'express';
import dotenv from 'dotenv';
import { env } from './config/env.js';

import authRoutes from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger.js';
import { httpLogger } from './middlewares/httpLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';

dotenv.config();

const app = express();
const PORT = env.PORT;

app.use(httpLogger);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req: Request, res: Response) => {
    res.status(200)
        .json({
            status: "success",
            message: "welcome to auth starter"
        })
})

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: "Success",
      message: "Server is healthy"
    })
})

// use global error handler
app.use(errorHandler);

const startServer = async () => {
  try {
    // 1. Ping the database to ensure it is actively accepting connections
    await db.execute(sql`SELECT 1`);
    logger.info('📦 Database connected successfully');

    // 2. Start the Express server ONLY if the database is ready
    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // 3. Fail-Fast: Log the error and shut down the Node process
    logger.error('❌ Database connection failed. Shutting down server...', error);
    process.exit(1);
  }
};

startServer();