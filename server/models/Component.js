const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema(
  {
    itemNo: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    particulars: { type: String, required: true },
    hsnCode: { type: String, required: true },
    unitRate: { type: Number, required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

componentSchema.index({ name: 'text', particulars: 'text', category: 'text' });

module.exports = mongoose.model('Component', componentSchema);
