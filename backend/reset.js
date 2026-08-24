const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/hirate')
  .then(() => {
    const ExtractionTask = require('./src/models/ExtractionTask.model');
    return ExtractionTask.updateMany(
      { status: 'Processing' },
      { $set: { status: 'Failed', errorMessage: 'Server restarted during processing' } }
    );
  })
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
