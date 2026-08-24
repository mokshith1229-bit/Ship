const mongoose = require('mongoose');
const ExtractionTask = require('./src/models/ExtractionTask.model');

const start = async () => {
  await mongoose.connect('mongodb://chwminds_db_user:RandD1900@ac-juvwhvv-shard-00-02.y3bch7z.mongodb.net:27017,ac-juvwhvv-shard-00-01.y3bch7z.mongodb.net:27017,ac-juvwhvv-shard-00-00.y3bch7z.mongodb.net:27017/hirate2?authSource=admin&replicaSet=atlas-c2m17u-shard-0&tls=true');
  const res = await ExtractionTask.updateOne({ project: 'GMC - BS 2', status: 'Completed' }, { $set: { status: 'Failed' } }, { sort: { createdAt: -1 } });
  console.log('Updated:', res);
  process.exit(0);
};

start();
