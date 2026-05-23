import { Router } from 'express';
import passport from 'passport';
import {
  register,
  login,
  logout,
  refresh,
  getMe,
  googleCallback,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/refresh', refresh);
authRouter.get('/me', requireAuth, getMe);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  authRouter.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );
  authRouter.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${frontendUrl}/login?error=oauth_failed`,
    }),
    googleCallback
  );
}
