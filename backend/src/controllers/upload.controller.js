import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma } from '../config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, `avatar-${req.user.sub}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed'));
  },
});

export function avatarUploadMiddleware(req, res, next) {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ error: 'Image must be 2 MB or smaller' });
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

function publicUrl(req, filename) {
  const base =
    process.env.BACKEND_PUBLIC_URL ||
    `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${filename}`;
}

export async function setAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = publicUrl(req, req.file.filename);
    const user = await prisma.user.update({
      where: { id: req.user.sub },
      data: { avatar: url },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
