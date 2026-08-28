require('dotenv').config();
const mongoose = require('mongoose');
const Component = require('./models/Component');

const DEFAULT_HSN = '8684900';
const ARCH_HSN = '998517';

const components = [
  {
    itemNo: '6',
    name: 'BAR 32x48',
    category: 'BAR 32x48',
    particulars: 'BAR 32x48 ITEM NO: 6 With Material 87141090',
    hsnCode: DEFAULT_HSN,
    unitRate: 29.61,
    notes: 'With Material 87141090',
  },
  {
    itemNo: '4',
    name: 'BAR 18x30',
    category: 'BAR 18x30',
    particulars: 'BAR 18x30 ITEM NO: 4 With Material 87141090',
    hsnCode: DEFAULT_HSN,
    unitRate: 7.91,
    notes: 'With Material 87141090',
  },
  {
    itemNo: '1',
    name: 'BOSS DIA 19x20',
    category: 'BOSS DIA 19x20',
    particulars: 'BOSS DIA 19x20 ITEM NO: 1 With Material 87141090',
    hsnCode: DEFAULT_HSN,
    unitRate: 5.52,
    notes: 'With Material 87141090',
  },
  {
    itemNo: 'K2150169',
    name: 'BOSS HANDLE BAR',
    category: 'BOSS HANDLE BAR',
    particulars: 'BOSS HANDLE BAR K2150169 With Material 87141090',
    hsnCode: DEFAULT_HSN,
    unitRate: 4.8,
    notes: 'With Material 87141090',
  },
  {
    itemNo: '2',
    name: 'ARCH HANDLE SUPPORT',
    category: 'ARCH HANDLE SUPPORT',
    particulars: 'ARCH HANDLE SUPPORT ITEM NO: 2 (For Labour charges only) 9988',
    hsnCode: ARCH_HSN,
    unitRate: 4.95,
    notes: 'For Labour charges only',
  },
  {
    itemNo: '7',
    name: 'BAR 32x48 - Variant A',
    category: 'BAR 32x48',
    particulars: 'BAR 32x48 ITEM NO: 7 With Material 87141090',
    hsnCode: DEFAULT_HSN,
    unitRate: 28.5,
    notes: 'With Material 87141090',
  },
  {
    itemNo: '5',
    name: 'BAR 18x30 - Heavy Duty',
    category: 'BAR 18x30',
    particulars: 'BAR 18x30 ITEM NO: 5 Heavy Duty With Material 87141090',
    hsnCode: DEFAULT_HSN,
    unitRate: 8.25,
    notes: 'With Material 87141090',
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Component.deleteMany({});
  await Component.insertMany(components);
  console.log(`Seeded ${components.length} components`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
