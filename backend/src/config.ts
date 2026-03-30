function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

function parseOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const jwtSecret = process.env.JWT_SECRET || 'dev-insecure-key-change-me';
const frontendOrigins = parseOrigins(process.env.FRONTEND_ORIGIN || 'http://localhost:4200');
const dbPassword = process.env.DB_PASSWORD || 'fawn_password';
const autoSeed = parseBoolean(process.env.AUTO_SEED, !isProduction);

if (isProduction && jwtSecret === 'dev-insecure-key-change-me') {
  throw new Error('JWT_SECRET must be set to a secure value in production');
}

if (isProduction && frontendOrigins.length === 0) {
  throw new Error('FRONTEND_ORIGIN must define at least one allowed origin in production');
}

if (isProduction && dbPassword === 'fawn_password') {
  throw new Error('DB_PASSWORD must be changed from default in production');
}

if (isProduction && autoSeed && (process.env.SEED_ADMIN_PASSWORD || 'admin123') === 'admin123') {
  throw new Error('SEED_ADMIN_PASSWORD must be changed when AUTO_SEED=true in production');
}

export const appConfig = {
  nodeEnv,
  isProduction,
  port: parseNumber(process.env.PORT, 4000),
  parcelsGeoJsonPath: process.env.PARCELS_GEOJSON_PATH,
  enableMockGrouping: parseBoolean(process.env.ENABLE_MOCK_GROUPING, !isProduction),
  mockTotalHegegemeinschaften: parseNumber(process.env.MOCK_TOTAL_HEGEGEMEINSCHAFTEN, 11),
  mockTotalReviere: parseNumber(process.env.MOCK_TOTAL_REVIERE, 131),
  frontendOrigins,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseNumber(process.env.DB_PORT, 5432),
    user: process.env.DB_USER || 'fawn_user',
    password: dbPassword,
    database: process.env.DB_NAME || 'fawn_rescue'
  },
  autoSeed
};
