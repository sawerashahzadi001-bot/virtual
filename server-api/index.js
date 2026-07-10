import express from 'express';
import cors from 'cors';
import fs from 'fs';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;
const useMongo = Boolean(mongoUri);
const client = useMongo ? new MongoClient(mongoUri) : null;
let usersCollection = null;

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const usersFile = join(__dirname, 'users.json');

function readJsonFile(path) {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, '[]', 'utf8');
  }

  const content = fs.readFileSync(path, 'utf8');
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function writeJsonFile(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
}

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

function sanitizeUser(user) {
  const { password, _id, created_at, createdAt, ...safeUser } = user;
  return {
    ...safeUser,
    id: user.id ?? (_id ? _id.toString() : undefined),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt ?? user.created_at,
  };
}

function getUsersFromJson() {
  return readJsonFile(usersFile);
}

function saveUsersToJson(users) {
  writeJsonFile(usersFile, users);
}

async function findUserByEmail(email) {
  const normalizedEmail = String(email).trim().toLowerCase();

  if (client) {
    return await usersCollection.findOne({ email: normalizedEmail });
  }

  const users = getUsersFromJson();
  return users.find((user) => user.email === normalizedEmail) || null;
}

async function createUser({ id, name, email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = {
    id,
    name: String(name).trim(),
    email: normalizedEmail,
    password: String(password),
    createdAt: new Date().toISOString(),
  };

  if (client) {
    await usersCollection.insertOne({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      created_at: user.createdAt,
    });
    return user;
  }

  const users = getUsersFromJson();
  users.push(user);
  saveUsersToJson(users);
  return user;
}

async function initDatabase() {
  if (!client) return;

  await client.connect();
  const db = client.db();
  usersCollection = db.collection('users');
  await usersCollection.createIndex({ email: 1 }, { unique: true });
}

app.get('/api/products', (req, res) => {
  const products = JSON.parse(fs.readFileSync(join(__dirname, 'products.json'), 'utf8'));
  res.json(products);
});

app.get('/api/products/ar-outfits', (req, res) => {
  const arOutfits = JSON.parse(fs.readFileSync(join(__dirname, 'ar-outfits.json'), 'utf8'));
  res.json(arOutfits);
});

app.get('/api/health', async (req, res) => {
  if (client) {
    try {
      await client.db().command({ ping: 1 });
      return res.json({ ok: true, db: true });
    } catch (error) {
      console.error('DB health check failed:', error);
      return res.status(500).json({ ok: false, db: false });
    }
  }

  return res.json({ ok: true, db: false });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return res.status(400).json({ message: 'Email already registered.' });
  }

  const newUser = await createUser({
    id: `${Date.now()}`,
    name,
    email: normalizedEmail,
    password,
  });

  return res.status(201).json({
    token: createToken(),
    user: sanitizeUser(newUser),
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const existing = await findUserByEmail(email);

  if (!existing || existing.password !== String(password)) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  return res.json({
    token: createToken(),
    user: sanitizeUser(existing),
  });
});

app.get('/api/auth/users', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found.' });
  }

  if (client) {
    const users = await usersCollection.find().sort({ created_at: -1 }).toArray();
    return res.json(users.map(sanitizeUser));
  }

  const users = getUsersFromJson();
  return res.json(users.map(sanitizeUser));
});

const distPath = join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(distPath, 'index.html'));
  });
}

async function startServer() {
  if (client) {
    await initDatabase();
  }

  app.listen(port, () => console.log(`Mock API listening on http://localhost:${port}`));
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
