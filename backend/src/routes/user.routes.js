import { Router } from 'express';
import { prisma } from '../config/database.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { avatarUploadMiddleware, setAvatar } from '../controllers/upload.controller.js';

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.post('/avatar', avatarUploadMiddleware, setAvatar);

userRouter.get('/profile', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

userRouter.patch('/profile', async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (avatar !== undefined) data.avatar = avatar;
    const user = await prisma.user.update({
      where: { id: req.user.sub },
      data,
      select: { id: true, email: true, name: true, avatar: true, role: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});
