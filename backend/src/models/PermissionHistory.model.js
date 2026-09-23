'use strict';

const mongoose = require('mongoose');

const permissionHistorySchema = new mongoose.Schema(
  {
    roleId: {
      type: String,
      required: true,
      trim: true
    },
    featureId: {
      type: String,
      required: true,
      trim: true
    },
    changedBy: {
      type: String,
      required: true,
      default: 'Admin'
    },
    oldPermission: {
      type: Object,
      default: null
    },
    newPermission: {
      type: Object,
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

permissionHistorySchema.index({ featureId: 1, changedAt: -1 });

const PermissionHistory = mongoose.models.PermissionHistory || mongoose.model('PermissionHistory', permissionHistorySchema);

module.exports = PermissionHistory;
