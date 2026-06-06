import express, {Request, Response} from 'express';
import dotenv from 'dotenv';
import { env } from './config/env.js';

import authRoutes from './routes/auth.route.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
const PORT = env.PORT;

app.use('/api/auth', authRoutes);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: "Success",
      message: "Server is healthy"
    })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});