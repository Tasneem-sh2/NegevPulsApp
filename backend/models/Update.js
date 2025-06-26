// models/Update.js
const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  villageName: { type: String, required: true },
  updateType: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }], // This will store the file paths of images
}, { timestamps: true });

const Update = mongoose.model('Update', updateSchema);

module.exports = { Update };
