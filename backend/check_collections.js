require('dotenv').config();
const mongoose = require('mongoose');

async function checkCollections() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  
  // Count documents in each collection
  for (const c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(`${c.name}: ${count} documents`);
  }
  
  process.exit(0);
}

checkCollections().catch(console.error);
