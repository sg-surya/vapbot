import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

// Initialize Database
const db = new Database('app.db');

// Setup Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    name TEXT,
    published INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botId INTEGER UNIQUE,
    flowData TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(botId) REFERENCES bots(id) ON DELETE CASCADE
  );
`);

// Prepared Statements
const insertUser = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
const getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const getUserById = db.prepare('SELECT id, email FROM users WHERE id = ?');

const insertBot = db.prepare('INSERT INTO bots (userId, name) VALUES (?, ?)');
const getBotsByUser = db.prepare('SELECT * FROM bots WHERE userId = ? ORDER BY createdAt DESC');
const getBotById = db.prepare('SELECT * FROM bots WHERE id = ? AND userId = ?');
const getBotByIdPublic = db.prepare('SELECT * FROM bots WHERE id = ? AND published = 1');
const deleteBot = db.prepare('DELETE FROM bots WHERE id = ? AND userId = ?');
const togglePublishBot = db.prepare('UPDATE bots SET published = ? WHERE id = ? AND userId = ?');

const insertOrUpdateFlow = db.prepare(`
  INSERT INTO flows (botId, flowData, updatedAt) 
  VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(botId) DO UPDATE SET 
    flowData = excluded.flowData,
    updatedAt = CURRENT_TIMESTAMP
`);
const getFlowByBotId = db.prepare('SELECT * FROM flows WHERE botId = ?');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Authentication Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Auth
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = insertUser.run(email, hashedPassword);
      
      const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: result.lastInsertRowid, email } });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = getUserByEmail.get(email) as any;
      
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const user = getUserById.get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  });

  // Bots CRUD
  app.get('/api/bots', authenticateToken, (req: any, res) => {
    const bots = getBotsByUser.all(req.user.id);
    res.json(bots);
  });

  app.post('/api/bots', authenticateToken, (req: any, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Bot name required' });
    
    const result = insertBot.run(req.user.id, name);
    // Initialize an empty flow for the new bot
    const initialFlow = JSON.stringify({ nodes: [], edges: [] });
    insertOrUpdateFlow.run(result.lastInsertRowid, initialFlow);

    res.json({ id: result.lastInsertRowid, name, userId: req.user.id });
  });

  app.delete('/api/bots/:id', authenticateToken, (req: any, res) => {
    const result = deleteBot.run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Bot not found or unauthorized' });
    res.json({ success: true });
  });

  app.post('/api/bots/:id/publish', authenticateToken, (req: any, res) => {
    const { published } = req.body;
    const result = togglePublishBot.run(published ? 1 : 0, req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Bot not found or unauthorized' });
    res.json({ success: true, published: !!published });
  });

  // Public Flow Access
  app.get('/api/public/flows/:botId', (req: any, res) => {
    const bot = getBotByIdPublic.get(req.params.botId);
    if (!bot) return res.status(404).json({ error: 'Bot not found or not published' });

    const flow = getFlowByBotId.get(req.params.botId) as any;
    if (!flow) return res.json({ nodes: [], edges: [] });
    
    res.json(JSON.parse(flow.flowData));
  });

  // Flows
  app.get('/api/flows/:botId', authenticateToken, (req: any, res) => {
    // Verify bot ownership
    const bot = getBotById.get(req.params.botId, req.user.id);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    const flow = getFlowByBotId.get(req.params.botId) as any;
    if (!flow) return res.json({ nodes: [], edges: [] });
    
    res.json(JSON.parse(flow.flowData));
  });

  app.post('/api/flows/:botId', authenticateToken, (req: any, res) => {
    // Verify bot ownership
    const bot = getBotById.get(req.params.botId, req.user.id);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    const flowData = JSON.stringify(req.body);
    insertOrUpdateFlow.run(req.params.botId, flowData);
    
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
