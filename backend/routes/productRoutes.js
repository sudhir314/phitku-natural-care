const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');
// Import the configured upload middleware
const { upload } = require('../config/cloudinary'); 

// GET ALL PRODUCTS
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET SINGLE PRODUCT
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) res.json(product);
        else res.status(404).json({ message: 'Product not found' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// DELETE PRODUCT (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- CREATE PRODUCT (Fixed: Uses centralized upload) ---
router.post('/', protect, admin, upload.single('imageFile'), async (req, res) => {
    try {
        // 1. Default fallback image
        let imageUrl = "https://via.placeholder.com/300?text=No+Image"; 

        // 2. Get image from Cloudinary storage (req.file.path is provided by multer-storage-cloudinary)
        if (req.file && req.file.path) {
            imageUrl = req.file.path;
        } else if (req.body.image && req.body.image.startsWith('http')) {
            imageUrl = req.body.image;
        }

        const product = new Product({
            user: req.user._id,
            name: req.body.name,
            price: req.body.price,
            originalPrice: req.body.originalPrice,
            image: imageUrl,
            category: req.body.category,
            tag: req.body.tag,
            description: req.body.description,
            isAvailable: req.body.isAvailable === 'true'
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);

    } catch (error) {
        console.error("Database Save Error:", error);
        res.status(500).json({ message: 'Product creation failed', error: error.message });
    }
});

// --- UPDATE PRODUCT (Fixed) ---
router.put('/:id', protect, admin, upload.single('imageFile'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            let imageUrl = product.image;

            // Check if a new file was uploaded
            if (req.file && req.file.path) {
                imageUrl = req.file.path;
            } else if (req.body.image) {
                imageUrl = req.body.image;
            }

            product.name = req.body.name || product.name;
            product.price = req.body.price || product.price;
            product.originalPrice = req.body.originalPrice || product.originalPrice;
            product.description = req.body.description || product.description;
            product.image = imageUrl;
            product.category = req.body.category || product.category;
            product.tag = req.body.tag || product.tag;
            
            // Handle boolean conversion for multipart/form-data
            if (req.body.isAvailable !== undefined) {
                product.isAvailable = req.body.isAvailable === 'true';
            }

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: 'Update failed' });
    }
});

module.exports = router;// --- CREATE PRODUCT (Fixed: Uses centralized upload) ---
router.post('/', protect, admin, upload.single('imageFile'), async (req, res) => {
    try {
        // 1. Default fallback image
        let imageUrl = "https://via.placeholder.com/300?text=No+Image"; 

        // 2. Get image from Cloudinary storage (req.file.path is provided by multer-storage-cloudinary)
        if (req.file && req.file.path) {
            imageUrl = req.file.path;
        } else if (req.body.image && req.body.image.startsWith('http')) {
            imageUrl = req.body.image;
        }

        const product = new Product({
            user: req.user._id,
            name: req.body.name,
            price: req.body.price,
            originalPrice: req.body.originalPrice,
            image: imageUrl,
            category: req.body.category,
            tag: req.body.tag,
            description: req.body.description,
            isAvailable: req.body.isAvailable === 'true'
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);

    } catch (error) {
        console.error("Database Save Error:", error);
        res.status(500).json({ message: 'Product creation failed', error: error.message });
    }
});

// --- UPDATE PRODUCT (Fixed) ---
router.put('/:id', protect, admin, upload.single('imageFile'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            let imageUrl = product.image;

            // Check if a new file was uploaded
            if (req.file && req.file.path) {
                imageUrl = req.file.path;
            } else if (req.body.image) {
                imageUrl = req.body.image;
            }

            product.name = req.body.name || product.name;
            product.price = req.body.price || product.price;
            product.originalPrice = req.body.originalPrice || product.originalPrice;
            product.description = req.body.description || product.description;
            product.image = imageUrl;
            product.category = req.body.category || product.category;
            product.tag = req.body.tag || product.tag;
            
            // Handle boolean conversion for multipart/form-data
            if (req.body.isAvailable !== undefined) {
                product.isAvailable = req.body.isAvailable === 'true';
            }

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: 'Update failed' });
    }
});

module.exports = router;    