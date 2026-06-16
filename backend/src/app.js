import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import passport from './config/passport.js';
import { rateLimit } from 'express-rate-limit';
import { authRouter } from './routes/auth.routes.js';
import { productRouter } from './routes/product.routes.js';
import { cartRouter } from './routes/cart.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { userRouter } from './routes/user.routes.js';
import { agentRouter } from './routes/agent.routes.js';
import { wishlistRouter } from './routes/wishlist.routes.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { syncProductsFromAPI } from './services/product.service.js';
import cron from 'node-cron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
// Behind Render's proxy — trust X-Forwarded-* so req.secure reflects HTTPS.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(passport.initialize());
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'), {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/', (_, res) =>
  res.status(200).send('TechKart API is running. Try /api/health or /api/products.')
);

app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/users', userRouter);
app.use('/api/agent', agentRouter);
app.use('/api/wishlist', wishlistRouter);
app.get('/api/health', (_, res) => res.json({ status: 'ok', platform: 'TechKart' }));
app.use(errorHandler);

if (process.env.SYNC_ON_BOOT !== 'false') {
  syncProductsFromAPI().catch((err) => console.error('[Boot Sync]', err.message));
  cron.schedule('0 */6 * * *', () =>
    syncProductsFromAPI().catch((err) => console.error('[Cron Sync]', err.message))
  );
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`TechKart API running on :${PORT}`));

export default app;
