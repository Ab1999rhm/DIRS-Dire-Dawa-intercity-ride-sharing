const mongoose = require('mongoose');
const Place = require('./src/models/Place');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dirs';

const INTERCITY_DESTINATIONS = [
  { name: 'Harar', key: 'harar', emoji: '\uD83D\uDD4C', lat: 9.3115, lon: 42.1199 },
  { name: 'Addis Ababa', key: 'addis ababa', emoji: '\uD83C\uDFD9\uFE0F', lat: 9.0192, lon: 38.7525 },
  { name: 'Jijiga', key: 'jijiga', emoji: '\uD83C\uDFDC\uFE0F', lat: 9.3506, lon: 42.7933 },
  { name: 'Combolcha', key: 'combolcha', emoji: '\uD83C\uDFD4\uFE0F', lat: 8.9300, lon: 39.8700 },
  { name: 'Awash', key: 'awash', emoji: '\uD83C\uDF3F', lat: 8.9833, lon: 40.1500 },
  { name: 'Debre Markos', key: 'debre markos', emoji: '\u26EA', lat: 10.3400, lon: 37.7300 },
  { name: 'Adama (Nazret)', key: 'adama', emoji: '\uD83C\uDFDE\uFE0F', lat: 8.5400, lon: 39.2700 },
  { name: 'Hawassa', key: 'hawassa', emoji: '\uD83C\uDF0A', lat: 7.0621, lon: 38.4763 },
  { name: 'Bahir Dar', key: 'bahir dar', emoji: '\uD83C\uDFDE\uFE0F', lat: 11.5938, lon: 37.3909 },
  { name: 'Mekelle', key: 'mekelle', emoji: '\uD83C\uDFD9\uFE0F', lat: 13.4967, lon: 39.4753 },
  { name: 'Jimma', key: 'jimma', emoji: '\uD83C\uDF33', lat: 7.6789, lon: 36.8340 },
  { name: 'Dessie', key: 'dessie', emoji: '\uD83C\uDFD9\uFE0F', lat: 11.1321, lon: 39.6353 },
  { name: 'Chiro', key: 'chiro', emoji: '\uD83C\uDF3E', lat: 9.0667, lon: 40.8667 },
  { name: 'Asebe Teferi', key: 'asebe teferi', emoji: '\uD83C\uDF3E', lat: 9.0667, lon: 40.8667 },
];

const DIRE_DAWA_PLACES = [
  { name: 'Sabian', key: 'sabian', lat: 9.5950, lon: 41.8600, category: 'neighborhood' },
  { name: 'Kezira', key: 'kezira', lat: 9.6080, lon: 41.8450, category: 'neighborhood' },
  { name: 'Addis Ketema', key: 'addis ketema', lat: 9.5990, lon: 41.8530, category: 'neighborhood' },
  { name: 'Gendekore', key: 'gendekore', lat: 9.6120, lon: 41.8390, category: 'neighborhood' },
  { name: 'Dire Dawa City Center', key: 'city center', lat: 9.6009, lon: 41.8508, category: 'landmark' },
  { name: 'Melka Jebdu', key: 'melka jebdu', lat: 9.5880, lon: 41.8700, category: 'neighborhood' },
  { name: 'Legehare', key: 'legehare', lat: 9.6050, lon: 41.8470, category: 'neighborhood' },
  { name: 'Taiwan', key: 'taiwan', lat: 9.6030, lon: 41.8540, category: 'neighborhood' },
  { name: 'Ashewa', key: 'ashewa', lat: 9.6090, lon: 41.8610, category: 'neighborhood' },
  { name: 'Megala', key: 'megala', lat: 9.5910, lon: 41.8650, category: 'neighborhood' },
  { name: 'Buramedo', key: 'buramedo', lat: 9.5870, lon: 41.8430, category: 'neighborhood' },
  { name: 'Kebele 01', key: 'kebele 01', lat: 9.6015, lon: 41.8495, category: 'neighborhood' },
  { name: 'Kebele 05', key: 'kebele 05', lat: 9.6035, lon: 41.8515, category: 'neighborhood' },
  { name: 'Kebele 08', key: 'kebele 08', lat: 9.5970, lon: 41.8560, category: 'neighborhood' },
  { name: 'Dire Dawa Market', key: 'dire dawa market', lat: 9.6010, lon: 41.8500, category: 'market' },
  { name: 'Kezira Market', key: 'kezira market', lat: 9.6070, lon: 41.8460, category: 'market' },
  { name: 'Shoa Market', key: 'shoa market', lat: 9.6005, lon: 41.8510, category: 'market' },
  { name: 'Mekonisa Market', key: 'mekonisa market', lat: 9.6025, lon: 41.8520, category: 'market' },
  { name: 'Dire Dawa Hospital', key: 'dire dawa hospital', lat: 9.6012, lon: 41.8485, category: 'hospital' },
  { name: 'Sabian Health Center', key: 'sabian health center', lat: 9.5945, lon: 41.8595, category: 'hospital' },
  { name: 'Kezira Health Center', key: 'kezira health center', lat: 9.6075, lon: 41.8455, category: 'hospital' },
  { name: 'Dire Dawa Polytechnic', key: 'polytechnic', lat: 9.6040, lon: 41.8490, category: 'school' },
  { name: 'Mekane Yesus School', key: 'mekane yesus', lat: 9.6000, lon: 41.8515, category: 'school' },
  { name: 'Dire Dawa Bus Station', key: 'bus station', lat: 9.6018, lon: 41.8508, category: 'transport' },
  { name: 'Dire Dawa Airport', key: 'airport', lat: 9.6247, lon: 41.8542, category: 'transport' },
  { name: 'Samrat Hotel', key: 'samrat hotel', lat: 9.6018, lon: 41.8488, category: 'hotel' },
  { name: 'Ras Hotel', key: 'ras hotel', lat: 9.6022, lon: 41.8505, category: 'hotel' },
  { name: 'Ethiopia Hotel', key: 'ethiopia hotel', lat: 9.6012, lon: 41.8498, category: 'hotel' },
  { name: 'Dire Dawa City Administration', key: 'city administration', lat: 9.6008, lon: 41.8492, category: 'government' },
  { name: 'Dire Dawa Police Station', key: 'police station', lat: 9.6002, lon: 41.8478, category: 'government' },
  { name: 'Dire Dawa Post Office', key: 'post office', lat: 9.6011, lon: 41.8501, category: 'government' },
  { name: 'Commercial Bank of Ethiopia', key: 'cbe dire dawa', lat: 9.6015, lon: 41.8505, category: 'government' },
  { name: 'Awash Bank Dire Dawa', key: 'awash bank dire dawa', lat: 9.6020, lon: 41.8510, category: 'government' },
  { name: 'Dire Dawa Stadium', key: 'stadium', lat: 9.6085, lon: 41.8440, category: 'landmark' },
  { name: 'Central Mosque', key: 'central mosque', lat: 9.6009, lon: 41.8520, category: 'landmark' },
  { name: 'St. Gabriel Church', key: 'st gabriel church', lat: 9.5995, lon: 41.8490, category: 'landmark' },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    let intercityCreated = 0, intercitySkipped = 0;
    for (const p of INTERCITY_DESTINATIONS) {
      const exists = await Place.findOne({ key: p.key, type: 'intercity' });
      if (exists) { intercitySkipped++; continue; }
      await Place.create({
        name: p.name, type: 'intercity', key: p.key,
        label: `${p.name}, Ethiopia`, emoji: p.emoji,
        coordinates: { lat: p.lat, lon: p.lon }, city: p.name,
        category: 'city', isActive: true
      });
      intercityCreated++;
    }

    let intraCreated = 0, intraSkipped = 0;
    for (const p of DIRE_DAWA_PLACES) {
      const exists = await Place.findOne({ key: p.key, type: 'intra_city' });
      if (exists) { intraSkipped++; continue; }
      await Place.create({
        name: p.name, type: 'intra_city', key: p.key,
        label: `${p.name}, Dire Dawa`,
        coordinates: { lat: p.lat, lon: p.lon }, city: 'Dire Dawa',
        category: p.category || 'other', isActive: true
      });
      intraCreated++;
    }

    console.log(`Intercity: ${intercityCreated} created, ${intercitySkipped} skipped`);
    console.log(`Intra-city: ${intraCreated} created, ${intraSkipped} skipped`);
    console.log('Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
