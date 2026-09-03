const mongoose = require('mongoose');
const uri = "mongodb://chwminds_db_user:RandD1900@ac-juvwhvv-shard-00-02.y3bch7z.mongodb.net:27017,ac-juvwhvv-shard-00-01.y3bch7z.mongodb.net:27017,ac-juvwhvv-shard-00-00.y3bch7z.mongodb.net:27017/hirate2?authSource=admin&replicaSet=atlas-c2m17u-shard-0&tls=true";
mongoose.connect(uri).then(async () => {
  const doc = await mongoose.connection.db.collection('inspectiontasks').findOne({
    $or: [{ status: 'SKIPPED' }, { 'skippedAssetTypes.0': { $exists: true } }]
  });
  console.log(JSON.stringify(doc, null, 2));
  process.exit();
});
