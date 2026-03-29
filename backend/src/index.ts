import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { signAccessToken } from './auth/jwt';
import { authenticateRequest, requireRole } from './auth/middleware';
import {
  findUserByEmail,
  findUserById,
  seedDefaultUsers,
  toPublicUser,
  verifyPassword
} from './auth/repository';
import { appConfig } from './config';
import { initializeSchema, verifyDatabaseConnection } from './db';

dotenv.config();

const app = express();

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please try again later.'
  }
});

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  return appConfig.frontendOrigins.includes(origin);
}

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    credentials: true
  })
);

app.get('/health', (_req, res) => {
  res.status(200).json({
    service: 'fawn-rescue-backend',
    status: 'ok'
  });
});

app.post('/api/auth/login', loginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({
        message: 'email and password are required'
      });
      return;
    }

    const user = await findUserByEmail(email);

    if (!user) {
      res.status(401).json({
        message: 'Invalid credentials'
      });
      return;
    }

    const validPassword = await verifyPassword(password, user.passwordHash);

    if (!validPassword) {
      res.status(401).json({
        message: 'Invalid credentials'
      });
      return;
    }

    const publicUser = toPublicUser(user);
    const accessToken = signAccessToken(publicUser);

    res.status(200).json({
      accessToken,
      user: publicUser
    });
  } catch (_error) {
    res.status(500).json({
      message: 'Login failed due to server error'
    });
  }
});

app.get('/api/me', authenticateRequest, async (req, res) => {
  try {
    const authUser = req.authUser;

    if (!authUser) {
      res.status(401).json({
        message: 'Authentication required'
      });
      return;
    }

    const user = await findUserById(authUser.id);

    if (!user) {
      res.status(404).json({
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      user: toPublicUser(user)
    });
  } catch (_error) {
    res.status(500).json({
      message: 'Unable to resolve user context'
    });
  }
});

app.get('/api/admin/ping', authenticateRequest, requireRole('admin'), (_req, res) => {
  res.status(200).json({
    message: 'admin access confirmed'
  });
});

async function bootstrap(): Promise<void> {
  await verifyDatabaseConnection();
  await initializeSchema();

  if (appConfig.autoSeed) {
    await seedDefaultUsers();
  }

  app.listen(appConfig.port, () => {
    console.log(`API listening on http://localhost:${appConfig.port} (${appConfig.nodeEnv})`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
