'use strict';

const mongoose = require('mongoose');

const importBatchSchema = new mongoose.Schema(
  {
    originalFileName: {
      type: String,
      required: true,
      trim: true
    },
    project: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    totalRows: {
      type: Number,
      default: 0
    },
    imported: {
      type: Number,
      default: 0
    },
    duplicates: {
      type: Number,
      default: 0
    },
    invalid: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Processing', 'Completed', 'Failed'],
      default: 'Processing'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const ImportBatch = mongoose.model('ImportBatch', importBatchSchema);

module.exports = ImportBatch;
