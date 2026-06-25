const mongoose = require('mongoose');

// Ek chhota sub-schema banaya jisse baar-baar text, x, y na likhna pade
const ElementSchema = new mongoose.Schema({
  text: { type: String },
  x: { type: Number },
  y: { type: Number },
  fontSize: { type: Number }
});

const LabelFormatSchema = new mongoose.Schema({
  labelWidth: { type: String, default: '50' },
  labelHeight: { type: String, default: '25' },
  
  // Saare objects ko ElementSchema se connect kar diya
  company: ElementSchema,
  product: ElementSchema,
  size: ElementSchema,
  Qty: ElementSchema,
  wholesale: ElementSchema,
  retail: ElementSchema,
  qrcode: ElementSchema,
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabelFormat', LabelFormatSchema);