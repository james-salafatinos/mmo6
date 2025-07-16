import express from 'express';
import { createServer } from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createTables, dropAllTables } from './db/postgres.js';
import createRouter from './routes/index.js';
import config from './config.js';
import { initSocketIO } from './socket.js';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO with our HTTP server
const io = initSocketIO(httpServer);

// Start the server
const server = httpServer.listen(config.port, listen);


// Set up middleware
app.use(express.static(join(__dirname, '../client')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../client/views/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(join(__dirname, '../client/views/login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(join(__dirname, '../client/views/signup.html'));
});

const router = createRouter();
app.use('/api', router);


// This call back just tells us that the server has started
function listen() {
  var host = server.address().address;
  var port = server.address().port;
  console.log("App listening at http://" + host + ":" + port);
  console.log("App listening at http://localhost:" + port);
}

if (config.database.dropAllTables) {
  dropAllTables();
}

// Initialize database tables if enabled in config
if (config.database.initializeTables) {
  createTables()
    .then(() => {
      console.log('[/server/server.js - createTables] Database initialized');
    })
    .catch(err => {
      console.error('[/server/server.js - createTables] Failed to initialize database:', err);
      process.exit(1);
    });
} else {
  console.log('[/server/server.js] Database table creation skipped - probably already exists (disabled in config)');
}
