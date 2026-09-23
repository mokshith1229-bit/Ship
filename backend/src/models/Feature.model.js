'use strict';

const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema(
  {
    featureId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    featureName: {
      type: String,
      required: true,
      trim: true
    },
    featureType: {
      type: String,
      enum: ['Module', 'Section'],
      required: true
    },
    moduleName: {
      type: String,
      required: true,
      trim: true
    },
    parentFeature: {
      type: String,
      default: null,
      trim: true
    },
    order: {
      type: Number,
      default: 0
    },
    status: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

featureSchema.index({ parentFeature: 1 });
featureSchema.index({ order: 1 });

const Feature = mongoose.models.Feature || mongoose.model('Feature', featureSchema);

module.exports = Feature;
