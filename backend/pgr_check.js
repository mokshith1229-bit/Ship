const mongoose = require('mongoose');
mongoose.connect('mongodb://chwminds_db_user:RandD1900@ac-juvwhvv-shard-00-02.y3bch7z.mongodb.net:27017,ac-juvwhvv-shard-00-01.y3bch7z.mongodb.net:27017,ac-juvwhvv-shard-00-00.y3bch7z.mongodb.net:27017/hirate2?authSource=admin&replicaSet=atlas-c2m17u-shard-0&tls=true')
  .then(() => require('./src/models/MasterList.model').find({ project: 'GMC - BS 2' }).lean())
  .then(records => { 
    const pgrRecords = records.filter(r => r.assetType.toLowerCase().includes('pgr') || r.parameter.toLowerCase().includes('pgr') || r.category.toLowerCase().includes('pgr'));
    console.log('Total Master List for GMC - BS 2:', records.length);
    console.log('PGR Records:', pgrRecords.length); 
    if(pgrRecords.length > 0) console.log(pgrRecords[0]); 
    process.exit(0); 
  })
  .catch(console.error);
