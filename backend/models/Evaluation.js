const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roleId: {
    type: String,
    required: true
  },
  candidateName: {
    type: String
  },
  cvText: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  strengths: {
    type: [String],
    default: []
  },
  weaknesses: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
