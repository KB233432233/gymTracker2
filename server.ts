import express from 'express';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(process.cwd(), 'database.json');

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading DB:', error);
  }
  return {
    exercises: [],
    sessions: [],
    plan: {},
    templates: []
  };
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;
    
    app.use(express.json());

    // API Routes
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', database: 'json' });
    });

    app.get('/api/exercises', (req, res) => {
      const db = readDb();
      res.json(db.exercises);
    });

    app.post('/api/exercises', (req, res) => {
      const db = readDb();
      const newEx = req.body;
      const index = db.exercises.findIndex((e: any) => e.id === newEx.id);
      if (index !== -1) {
        db.exercises[index] = newEx;
      } else {
        db.exercises.push(newEx);
      }
      writeDb(db);
      res.json({ status: 'ok' });
    });

    app.get('/api/sessions', (req, res) => {
      const db = readDb();
      res.json(db.sessions);
    });

    app.post('/api/sessions', (req, res) => {
      const db = readDb();
      const newSess = req.body;
      const index = db.sessions.findIndex((s: any) => s.id === newSess.id);
      if (index !== -1) {
        db.sessions[index] = newSess;
      } else {
        db.sessions.push(newSess);
      }
      writeDb(db);
      res.json({ status: 'ok' });
    });

    app.get('/api/plan', (req, res) => {
      const db = readDb();
      res.json(db.plan);
    });

    app.post('/api/plan', (req, res) => {
      const db = readDb();
      db.plan = req.body;
      writeDb(db);
      res.json({ status: 'ok' });
    });

    app.get('/api/templates', (req, res) => {
      const db = readDb();
      res.json(db.templates);
    });

    app.post('/api/templates', (req, res) => {
      const db = readDb();
      const newTemp = req.body;
      const index = db.templates.findIndex((t: any) => t.id === newTemp.id);
      if (index !== -1) {
        db.templates[index] = newTemp;
      } else {
        db.templates.push(newTemp);
      }
      writeDb(db);
      res.json({ status: 'ok' });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createServer({
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
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();
