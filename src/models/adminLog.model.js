import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
  },

  action: {
    type: String,
    required: true,
  },

  resource: {
    type: String,
    required: true,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const AdminLog = mongoose.model(
  'AdminLog',
  adminLogSchema
);