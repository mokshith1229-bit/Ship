const mongoose = require('mongoose');

const ExtractionTaskSchema = new mongoose.Schema({
  inspectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InspectionBatch', required: true },
  project: { type: String, required: true },
  source: { type: String, default: 'ADD_TO_CYCLE' },
  originalMasterListIds: [{ type: mongoose.Schema.Types.ObjectId }],
  selectedModelData: { type: Array, required: true }, // Snapshotted MasterList records
  status: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Failed'], default: 'Pending' },
  startedAt: { type: Date },
  completedAt: { type: Date },
  errorMessage: { type: String },
  retryCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExtractionTask', ExtractionTaskSchema);
