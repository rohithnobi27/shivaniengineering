const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  slNo: Number,
  componentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Component' },
  particulars: String,
  hsnCode: String,
  quantity: Number,
  unitRate: Number,
  amount: Number,
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    customerName: { type: String, required: true },
    customerAddress: { type: String, default: '' },
    customerGstin: { type: String, default: '' },
    poNo: { type: String, default: '' },
    poDate: { type: Date },
    dcNo: { type: String, default: '' },
    dcDate: { type: Date },
    vendorCode: { type: String, default: '' },
    vehicleNo: { type: String, default: '' },
    items: [lineItemSchema],
    subtotal: { type: Number, default: 0 },
    igstPercent: { type: Number, default: 18 },
    igstAmount: { type: Number, default: 0 },
    cgstPercent: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstPercent: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    amountInWords: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
