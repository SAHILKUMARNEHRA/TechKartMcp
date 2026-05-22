import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database.js';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signAccess = (id, role) =>
  jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '15m' });

const createRefresh = async (userId) => {
  const token = uuidv4();
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return token;
};

export async function register(req, res, next) {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password)
      return res.status(400).json({ error: 'email, name, password required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (await prisma.user.findUnique({ where: { email } }))
      return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });
    const accessToken = signAccess(user.id, user.role);
    res.cookie('refreshToken', await createRefresh(user.id), COOKIE_OPTS);
    res.status(201).json({ accessToken, user });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: 'Invalid credentials' });
    const accessToken = signAccess(user.id, user.role);
    res.cookie('refreshToken', await createRefresh(user.id), COOKIE_OPTS);
    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });
    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    await prisma.refreshToken.delete({ where: { token } });
    res.cookie('refreshToken', await createRefresh(stored.userId), COOKIE_OPTS);
    res.json({ accessToken: signAccess(stored.userId, stored.user.role) });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (token) await prisma.refreshToken.deleteMany({ where: { token } });
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function googleCallback(req, res) {
  const user = req.user;
  const accessToken = signAccess(user.id, user.role);
  res.cookie('refreshToken', await createRefresh(user.id), COOKIE_OPTS);
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
}
