const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const usersFilePath = path.join(__dirname, 'users.json');
const adminsFilePath = path.join(__dirname, 'admins.json');


const createDefaultPlayerStats = () => ({
  level: 1,
  xp: 0,  // xp is broken? fix
  bestCPS: 0,
  totalGames: 0,
  totalClicks: 0,
});


const loadUsers = () => {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(data);
    return users.map(user => ({
      ...user,
      playerStats: user.playerStats || createDefaultPlayerStats()
    }));
  } catch (error) {
    console.log('users.json went to get a milk?');
    return [];
  }
};

let users = loadUsers();
let adminUsernames = [];
try {
  const adminData = fs.readFileSync(adminsFilePath, 'utf8');
  adminUsernames = JSON.parse(adminData);
} catch (error) {
  console.log('admins.json is missing, a million bounty on his head');
}

const games = [];

const saveUsers = () => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

const crypto = require('crypto');
const JWT_SECRET = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET:', JWT_SECRET);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ message: 'Missing authentication token' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};



app.post('/register', async (req, res) => {
  try {
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }
    const existingUser = users.find(user => user.username === req.body.username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = { 
      id: users.length + 1, 
      username: req.body.username, 
      password: hashedPassword,
      playerStats: createDefaultPlayerStats(),
      recentGames: []
    };
    users.push(user);
    saveUsers();
    console.log('User registered:', user.username);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

app.post('/saveProfile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    users = loadUsers(); // should we reload? idek?
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = { ...users[userIndex], ...req.body };
    users[userIndex] = updatedUser;

    saveUsers();
    res.json({ message: 'Profile saved successfully' });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ message: 'Error saving profile' });
  }
});

app.post('/login', async (req, res) => {
  console.log('Login attempt:', req.body.username);
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ message: 'Missing credentials' });
  }
  users = loadUsers(); // should we reload? idek? again?
  const user = users.find(user => user.username === req.body.username);
  if (user == null) {
    console.log('User not found');
    return res.status(400).json({ message: 'User not found' });
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const isAdmin = adminUsernames.includes(user.username);
      const accessToken = jwt.sign({ id: user.id, username: user.username, isAdmin }, JWT_SECRET, { expiresIn: '1h' });
      console.log('Login successful for user:', user.username);
      res.json({ accessToken: accessToken });
    } else {
      console.log('Invalid password for user:', user.username);
      res.status(401).json({ message: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

app.post('/game', authenticateToken, (req, res) => {
  const { cps, clicks, duration, xpGained, newLevel, newXP } = req.body;
  const userId = req.user.id;

  users = loadUsers(); // my guts telling me thats really bad

  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  const user = users[userIndex];
  user.playerStats = {
    ...user.playerStats,
    bestCPS: Math.max(user.playerStats.bestCPS, cps),
    totalGames: user.playerStats.totalGames + 1,
    totalClicks: user.playerStats.totalClicks + clicks,
    xp: newXP,  // just xp
    level: newLevel
  };

  if (!user.recentGames) {
    user.recentGames = [];
  }
  user.recentGames.unshift({ cps, date: new Date().toISOString() });
  user.recentGames = user.recentGames.slice(0, 10);

  saveUsers(); // ion wanna do this nomo

  res.json({
    message: 'Game saved successfully',
    playerStats: user.playerStats,
    recentGames: user.recentGames
  });
});

app.get('/leaderboard', (req, res) => {
  users = loadUsers(); // my guts telling me thats really really really bad
  const leaderboard = users
    .filter(user => user.playerStats.totalGames > 0)
    .map(user => ({
      username: user.username,
      bestCPS: user.playerStats.bestCPS,
      level: user.playerStats.level,
      averageCPS: user.playerStats.totalGames > 0
        ? user.playerStats.totalClicks / (user.playerStats.totalGames * 10)
        : 0
    }))
    .sort((a, b) => b.bestCPS - a.bestCPS);
  res.json(leaderboard);
});

app.get('/user', authenticateToken, (req, res) => {
  users = loadUsers(); // bro :D
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (!user.playerStats) {
    user.playerStats = createDefaultPlayerStats();
    saveUsers();
  }
  const userData = {
    username: user.username,
    playerStats: user.playerStats,
    recentGames: user.recentGames || [],
    selectedCountry: user.selectedCountry || 'TR',
    profilePicture: user.profilePicture || '',
    isAdmin: adminUsernames.includes(user.username)
  };
  res.json(userData);
});

const updateExistingUsers = () => {
  users = loadUsers(); // yh
  let updated = false;
  users.forEach(user => {
    if (!user.playerStats) {
      user.playerStats = createDefaultPlayerStats();
      updated = true;
    } else if (user.playerStats.xp === undefined) {
      user.playerStats.xp = 0;
      updated = true;
    }
    if (!user.recentGames) {
      user.recentGames = [];
      updated = true;
    }
  });
  if (updated) {
    saveUsers();
    console.log('update dummies');
  } else {
    console.log('all updated');
  }
};


const autoSaveUsers = () => {
  saveUsers();
};

setInterval(autoSaveUsers, 5 * 60 * 1000);

updateExistingUsers();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`${PORT}`));