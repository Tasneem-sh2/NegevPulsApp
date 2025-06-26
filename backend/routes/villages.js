const express = require('express');
const router = express.Router();
const Village = require('../models/Village');

// GET all villages
router.get('/', async (req, res) => {
  try {
    const villages = await Village.find();
    res.status(200).json(villages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching villages', error: error.message });
  }
});

// GET single village by ID
router.get('/:id', async (req, res) => {
  try {
    const village = await Village.findById(req.params.id);
    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }
    res.status(200).json(village);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching village', error: error.message });
  }
});

// POST create new village
router.post('/addVillage', async (req, res) => {
    try {
        const { name, description, images } = req.body;
        
        // Validation
        if (!name || !description) {
            return res.status(400).json({ 
                error: "Name and description are required",
                details: {
                    name: !name ? "Missing village name" : undefined,
                    description: !description ? "Missing description" : undefined
                }
            });
        }

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ 
                error: "At least one valid image URL is required",
                details: {
                    images: !images ? "Missing images array" : 
                            !Array.isArray(images) ? "Images must be an array" :
                            images.length === 0 ? "At least one image required" : undefined
                }
            });
        }

        // Validate each image URL
        const invalidUrls = images.filter(url => {
            try {
                new URL(url);
                return false;
            } catch {
                return true;
            }
        });

        if (invalidUrls.length > 0) {
            return res.status(400).json({ 
                error: "Invalid image URLs detected",
                details: {
                    invalidUrls
                }
            });
        }

        const newVillage = new Village({
            name,
            description,
            images,
            location: {
                type: 'Point',
                coordinates: [0, 0] // Default coordinates
            }
        });

        await newVillage.save();
        
        res.status(201).json({
            success: true,
            village: {
                _id: newVillage._id,
                name: newVillage.name,
                description: newVillage.description,
                images: newVillage.images
            }
        });
    } catch (error) {
        console.error("Error saving village:", error);
        res.status(500).json({ 
            error: "Failed to save village",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT update village
router.put('/:id', async (req, res) => {
  try {
    const updatedVillage = await Village.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!updatedVillage) {
      return res.status(404).json({ message: 'Village not found' });
    }
    
    res.status(200).json(updatedVillage);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating village',
      error: error.message 
    });
  }
});

// DELETE village
router.delete('/:id', async (req, res) => {
  try {
    const deletedVillage = await Village.findByIdAndDelete(req.params.id);
    
    if (!deletedVillage) {
      return res.status(404).json({ message: 'Village not found' });
    }
    
    res.status(200).json({ message: 'Village deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting village',
      error: error.message 
    });
  }
});

module.exports = router;