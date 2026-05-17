const express = require('express');
const router = express.Router();
const Products = require('../models/productModule');
const upload = require("../middleware/multer");
const cloudinary = require("../middleware/cloudinary");

router.post("/auth/add-product", upload.single("image"), async (req, res) => {
  try {
    const { name, category, variants, packOf } = req.body;
    
    let imageUrl = req.body.image || ""; 

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "products" 
      });
      imageUrl = uploadResult.secure_url; 
    }

    // ---  Product Save  ---
    const newProduct = new Products({
      image: imageUrl, 
      name: name,
      category: category,
      packOf: packOf || '1',
      variants: typeof variants === 'string' ? JSON.parse(variants) : variants,
    });

    await newProduct.save();

    res.status(200).json({
      success: true,
      message: "Product saved successfully!",
      product: newProduct
    });

  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ success: false, message: "Error saving product", error });
  }
});

router.get('/auth/getProducts', async (req, res) => {
  try {
    const product = await Products.find();
    res.status(200).json({
      success: true,
      count: product.length,
      data: product
    });
  } catch (error) {
    console.log('Fetching products error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- UPDATE PRODUCT ---
router.put('/auth/update-product/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const { name, category, variants, packOf } = req.body;

    let imageUrl = req.body.image || ""; 

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "products"
      });
      imageUrl = uploadResult.secure_url;
    }

    // --- Variants ---
    let parsedVariants = variants;
    if (typeof variants === 'string') {
        try {
            parsedVariants = JSON.parse(variants);
        } catch (e) {
            parsedVariants = [];
        }
    }

    // --- Update Object ---
    const updateData = {
      name: name,
      category: category,
      packOf: packOf || '1',
      variants: parsedVariants,
      image: imageUrl, 
    };

    // --- Database Update ---
    const updatedProduct = await Products.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product Updated Successfully",
      product: updatedProduct
    });

  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
});

router.delete('/auth/DeleteProduct/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const DeleteProduct = await Products.findByIdAndDelete(id);

    if (!DeleteProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ 
        success: true,
        message: "Deleted successfully" 
    });

  } catch (error) {
    console.log('Deleting product error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stock Update API
router.put('/auth/stockUpdate', async (req, res) => {
    try {
        const { items } = req.body;

        if (items && items.length > 0) {
            for (let item of items) {
                // Check karein ki productId aur variantIndex dono majood hain
                if (item.productId && item.variantIndex !== undefined) {
                    
                    const product = await Products.findById(item.productId);

                    if (product) {
                        const qtyToMinus = Number(item.quantity || item.qty || 0);

                        // Normal aasan tareeke se stock minus karein
                        product.variants[item.variantIndex].stock = product.variants[item.variantIndex].stock - qtyToMinus;

                        // Updated product ko save kar dein
                        await product.save();
                    }
                }
            }
        }

        res.status(200).json({ success: true, message: "Stock successfully updated!" });

    } catch (error) {
        console.error("Stock Update Error:", error);
        res.status(500).json({ success: false, message: "Stock update fail ho gaya" });
    }
});

module.exports = router;