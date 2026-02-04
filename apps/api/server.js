const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.resolve(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simple JSON DB Helper
function readDb() {
    if (!fs.existsSync(DB_FILE)) {
        return { users: [] };
    }
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return data ? JSON.parse(data) : { users: [] };
    } catch (e) {
        console.error('Error reading DB:', e);
        return { users: [] };
    }
}

function writeDb(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error writing DB:', e);
    }
}

// Routes

// 0. Root
app.get('/', (req, res) => {
    res.json({ message: 'Babki API is running', service: 'api', version: '1.0.0' });
});

// 1. Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 2. Register User
app.post('/auth/register', (req, res) => {
    const { telegram_id, username, display_name } = req.body;

    if (!display_name) {
        return res.status(400).json({ error: 'Display name is required' });
    }

    const db = readDb();
    let user = null;

    // Find by telegram_id if exists
    if (telegram_id) {
        user = db.users.find(u => u.telegram_id.toString() === telegram_id.toString());
    }

    if (user) {
        // Update existing
        user.display_name = display_name;
        user.username = username;
    } else {
        // Create new
        const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
        user = {
            id: newId,
            telegram_id: telegram_id || `guest_${new Date().getTime()}`,
            username,
            display_name,
            registered_at: new Date().toISOString()
        };
        db.users.push(user);
    }

    writeDb(db);
    res.json({ success: true, userId: user.id, message: 'User registered' });
});

// 3. Get All Users (Admin)
app.get('/admin/users', (req, res) => {
    const db = readDb();
    // Sort: newest first
    const users = [...db.users].sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at));
    res.json({ users });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
