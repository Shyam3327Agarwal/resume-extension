require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const Role = require('./models/Role');
const User = require('./models/User');
const Evaluation = require('./models/Evaluation');
const Organization = require('./models/Organization');

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin Initialization (Standard for Cloud Functions)
admin.initializeApp();
console.log('Firebase Admin initialized');

// MongoDB Connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', environment: 'production' }));

// Middleware to protect routes
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error('Firebase Auth Error:', err);
    return res.sendStatus(403);
  }
}

// Admin middleware
async function requireAdmin(req, res, next) {
  if (!req.user || !req.user.admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Sync Firebase User to MongoDB
app.post('/api/users/sync', authenticateToken, async (req, res) => {
  try {
    const { uid, email } = req.user;
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      const org = new Organization({ name: `${email}'s Organization` });
      await org.save();
      user = new User({ firebaseUid: uid, email: email || 'unknown', organizationId: org._id });
      await user.save();
    }
    res.json({ message: 'User synced successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Settings Endpoint
app.put('/api/users/settings', authenticateToken, async (req, res) => {
  try {
    const { appKey } = req.body;
    let user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.appKey = appKey;
    await user.save();
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Roles Endpoints
app.get('/api/roles', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const roles = await Role.find({ organizationId: user.organizationId }, 'id title jd requirements');
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.post('/api/roles', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { id, title, jd, requirements } = req.body;
    const newRole = new Role({ organizationId: user.organizationId, id, title, jd, requirements });
    await newRole.save();
    res.json(newRole);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create role' });
  }
});

app.put('/api/roles/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { title, jd, requirements } = req.body;
    const role = await Role.findOneAndUpdate(
      { organizationId: user.organizationId, id: req.params.id },
      { title, jd, requirements },
      { new: true }
    );
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

app.delete('/api/roles/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const role = await Role.findOneAndDelete({ organizationId: user.organizationId, id: req.params.id });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json({ message: 'Role deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// Evaluate CV
app.post('/api/evaluate', authenticateToken, async (req, res) => {
  const { cvText, roleId, candidateName } = req.body;
  if (!cvText || !roleId) return res.status(400).json({ error: 'cvText and roleId are required' });

  try {
    const role = await Role.findOne({ id: roleId });
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const lowerCvText = cvText.toLowerCase();
    const strengths = [];
    const weaknesses = [];
    let score = 50;
    
    role.requirements.forEach(reqItem => {
      if (lowerCvText.includes(reqItem.toLowerCase())) {
        strengths.push(`Mentions experience with ${reqItem}`);
        score += 10;
      } else {
        weaknesses.push(`Does not appear to have experience with ${reqItem}`);
        score -= 5;
      }
    });

    score = Math.max(0, Math.min(100, score));
    let summary = score > 80 ? "Excellent fit" : score > 50 ? "Good fit" : "Poor fit";

    let user = await User.findOne({ firebaseUid: req.user.uid });
    if (user) {
      const evalDoc = new Evaluation({
        userId: user._id,
        roleId: roleId,
        candidateName: candidateName || "Unknown",
        cvText,
        score,
        summary,
        strengths,
        weaknesses
      });
      await evalDoc.save();
    }

    res.json({ score, summary, strengths, weaknesses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Evaluation failed' });
  }
});

// Admin Users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users.map(u => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      disabled: u.disabled,
      lastSignIn: u.metadata.lastSignInTime,
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

app.post('/api/admin/users/:uid/disable', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await admin.auth().updateUser(req.params.uid, { disabled: true });
    res.json({ message: 'User disabled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disable user' });
  }
});

app.post('/api/admin/users/:uid/enable', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await admin.auth().updateUser(req.params.uid, { disabled: false });
    res.json({ message: 'User enabled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enable user' });
  }
});

const functions = require('firebase-functions');
exports.api = functions.https.onRequest(app);
