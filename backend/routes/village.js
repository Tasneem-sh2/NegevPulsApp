import express from 'express';
import mongoose from 'mongoose';
import Village from '../models/Village.js'; // Assuming you have a Village model

const router = express.Router();

// GET all villages
router.get('/', async (req, res) => {
  try {
    const villages = await Village.find({});
    res.status(200).json({
      success: true,
      count: villages.length,
      data: villages.map(village => ({
        ...village.toObject(),
        _id: village._id.toString()
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching villages',
      error: error.message
    });
  }
});

// GET single village by ID
router.get('/:id', async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid village ID format'
      });
    }

    const village = await Village.findById(req.params.id);

    if (!village) {
      return res.status(404).json({
        success: false,
        message: 'Village not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...village.toObject(),
        _id: village._id.toString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching village',
      error: error.message
    });
  }
});

// POST create new village
router.post('/', async (req, res) => {
  try {
    const { name, description, images, location } = req.body;

    const newVillage = new Village({
      name,
      description,
      images: images || [],
      location: location || null
    });

    const savedVillage = await newVillage.save();

    res.status(201).json({
      success: true,
      data: {
        ...savedVillage.toObject(),
        _id: savedVillage._id.toString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error creating village',
      error: error.message
    });
  }
});

// PUT update village
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid village ID format'
      });
    }

    const updatedVillage = await Village.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedVillage) {
      return res.status(404).json({
        success: false,
        message: 'Village not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...updatedVillage.toObject(),
        _id: updatedVillage._id.toString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating village',
      error: error.message
    });
  }
});

// DELETE village
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid village ID format'
      });
    }

    const deletedVillage = await Village.findByIdAndDelete(req.params.id);

    if (!deletedVillage) {
      return res.status(404).json({
        success: false,
        message: 'Village not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Village deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting village',
      error: error.message
    });
  }
});

export default router;