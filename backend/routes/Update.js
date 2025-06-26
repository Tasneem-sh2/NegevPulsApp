const express = require('express');
//const Update = require('../models/Update');

const { Update,validateUpdate } = require('../models/Update');
const router = express.Router();

// Update route
router.put('/api/update/:id', async (req, res) => {
  const { id } = req.body;

  // Validate request data
  const { error } = validateUpdate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    // Find and update the record
    const updatedUpdate = await Update.findByIdAndUpdate(
      id,
      { ...req.body }, // Spread the updated fields from the request body
      { new: true } // Return the updated document
    );

    // Handle if the record is not found
    if (!updatedUpdate) {
      return res.status(404).json({ message: 'Update not found' });
    }

    // Respond with the updated record
    res.status(200).json({ message: 'Update successfully updated', updatedUpdate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred while updating the update', error: err.message });
  }
});

module.exports = router;
