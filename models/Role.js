const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  jd: {
    type: String,
    required: true
  },
  requirements: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model('Role', roleSchema);
