'use strict';

const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema(
  {
    roleId: {
      type: String, // 'Admin', 'SPV', 'User', 'HO', 'Administrator'
      required: true,
      trim: true
    },
    featureId: {
      type: String, // References Feature.featureId
      required: true,
      trim: true
    },
    permissions: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    }
  },
  {
    timestamps: true
  }
);

// Ensure a role can only have one permission record per feature
rolePermissionSchema.index({ roleId: 1, featureId: 1 }, { unique: true });

const RolePermission = mongoose.models.RolePermission || mongoose.model('RolePermission', rolePermissionSchema);

module.exports = RolePermission;
