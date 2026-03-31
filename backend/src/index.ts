import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { signAccessToken } from './auth/jwt';
import { authenticateRequest, requireRole } from './auth/middleware';
import { Role } from './auth/models';
import { ParcelCatalog } from './parcels/catalog';
import {
  findUserByEmail,
  findUserById,
  seedDefaultUsers,
  toPublicUser,
  verifyPassword
} from './auth/repository';
import { ApplicationStatus } from './applications/models';
import {
  createApplication,
  listApplications,
  updateApplicationStatus
} from './applications/repository';
import { appConfig } from './config';
import { initializeSchema, verifyDatabaseConnection } from './db';
import { createManagedUser, listManagedUsers, updateManagedUser } from './users/repository';

dotenv.config();

const app = express();
const parcelCatalog = new ParcelCatalog({
  geoJsonPath: appConfig.parcelsGeoJsonPath,
  enableMockGrouping: appConfig.enableMockGrouping,
  totalHegegemeinschaften: appConfig.mockTotalHegegemeinschaften,
  totalReviere: appConfig.mockTotalReviere
});

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

    if (!user.isActive) {
      res.status(403).json({
        message: 'User account is deactivated'
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

app.get('/api/applications', authenticateRequest, async (req, res) => {
  try {
    const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
    const searchParam = typeof req.query.search === 'string' ? req.query.search : undefined;
    const pageParam = Number(req.query.page);
    const pageSizeParam = Number(req.query.pageSize);

    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
    const pageSize =
      Number.isFinite(pageSizeParam) && pageSizeParam > 0
        ? Math.min(Math.floor(pageSizeParam), 100)
        : 10;

    if (statusParam && !['new', 'review', 'approved'].includes(statusParam)) {
      res.status(400).json({
        message: 'status must be one of: new, review, approved'
      });
      return;
    }

    const result = await listApplications({
      status: statusParam as ApplicationStatus | undefined,
      search: searchParam?.trim() || undefined,
      page,
      pageSize
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Failed to list applications', error);
    res.status(500).json({
      message: 'Unable to load applications'
    });
  }
});

app.post('/api/applications', authenticateRequest, async (req, res) => {
  try {
    const authUser = req.authUser;

    if (!authUser) {
      res.status(401).json({
        message: 'Authentication required'
      });
      return;
    }

    const { applicant, parcelReference, note } = req.body as {
      applicant?: string;
      parcelReference?: string;
      note?: string;
    };

    if (!applicant?.trim() || !parcelReference?.trim()) {
      res.status(400).json({
        message: 'applicant and parcelReference are required'
      });
      return;
    }

    const application = await createApplication({
      applicant: applicant.trim(),
      parcelReference: parcelReference.trim(),
      note: note?.trim() || '',
      createdByUserId: authUser.id
    });

    res.status(201).json({ application });
  } catch (error) {
    console.error('Failed to create application', error);
    res.status(500).json({
      message: 'Unable to create application'
    });
  }
});

app.patch('/api/applications/:id/status', authenticateRequest, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { status } = req.body as { status?: string };

    if (!status || !['new', 'review', 'approved'].includes(status)) {
      res.status(400).json({
        message: 'status must be one of: new, review, approved'
      });
      return;
    }

    const application = await updateApplicationStatus({
      id: applicationId,
      status: status as ApplicationStatus
    });

    if (!application) {
      res.status(404).json({
        message: 'Application not found'
      });
      return;
    }

    res.status(200).json({ application });
  } catch (error) {
    console.error('Failed to update application status', error);
    res.status(500).json({
      message: 'Unable to update application status'
    });
  }
});

app.get('/api/users', authenticateRequest, requireRole('admin'), async (_req, res) => {
  try {
    const users = await listManagedUsers();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Failed to list users', error);
    res.status(500).json({
      message: 'Unable to load users'
    });
  }
});

app.post('/api/users', authenticateRequest, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, role } = req.body as { name?: string; email?: string; role?: string };

    if (!name?.trim() || !email?.trim() || !role) {
      res.status(400).json({
        message: 'name, email and role are required'
      });
      return;
    }

    if (!['admin', 'dispatcher', 'viewer'].includes(role)) {
      res.status(400).json({
        message: 'role must be one of: admin, dispatcher, viewer'
      });
      return;
    }

    const user = await createManagedUser({
      name: name.trim(),
      email: email.trim(),
      role: role as Role
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Failed to create user', error);
    res.status(500).json({
      message: 'Unable to create user'
    });
  }
});

app.patch('/api/users/:id', authenticateRequest, requireRole('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { role, active } = req.body as { role?: string; active?: boolean };

    if (!role || typeof active !== 'boolean') {
      res.status(400).json({
        message: 'role and active are required'
      });
      return;
    }

    if (!['admin', 'dispatcher', 'viewer'].includes(role)) {
      res.status(400).json({
        message: 'role must be one of: admin, dispatcher, viewer'
      });
      return;
    }

    const user = await updateManagedUser({
      id: userId,
      role: role as Role,
      active
    });

    if (!user) {
      res.status(404).json({
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Failed to update user', error);
    res.status(500).json({
      message: 'Unable to update user'
    });
  }
});

app.get('/api/parcels/index', async (_req, res) => {
  try {
    const index = await parcelCatalog.getIndex();
    res.status(200).json(index);
  } catch (error) {
    console.error('Failed to load parcels index', error);
    res.status(500).json({
      message: 'Unable to load parcel index'
    });
  }
});

app.get('/api/parcels', async (req, res) => {
  try {
    const revierId = typeof req.query.revierId === 'string' ? req.query.revierId : undefined;
    const hegegemeinschaftId =
      typeof req.query.hegegemeinschaftId === 'string' ? req.query.hegegemeinschaftId : undefined;

    const collection = await parcelCatalog.getParcels({
      revierId,
      hegegemeinschaftId
    });

    res.status(200).json(collection);
  } catch (error) {
    console.error('Failed to load parcel geometry', error);
    res.status(500).json({
      message: 'Unable to load parcel geometry'
    });
  }
});

app.get('/api/parcels/mock-preview', authenticateRequest, requireRole('admin'), async (_req, res) => {
  try {
    const preview = await parcelCatalog.getMockPreview();
    res.status(200).json(preview);
  } catch (error) {
    console.error('Failed to load parcel mock preview', error);
    res.status(500).json({
      message: 'Unable to load parcel mock preview'
    });
  }
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
