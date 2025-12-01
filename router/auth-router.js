const express = require('express');
const router = express.Router();
const Product = require('../models/products-models');

router.post('/auth', async (req, res) => {
  try {
    const { productName, category, Title1, Title2, Title3, Title4, Title5, Title6, Title7, Title8, Title9,
      Price1, Price2, Price3, Price4, Price5, Price6, Price7, Price8, Price9, productIdEdit,
      UPrice1, UPrice2, UPrice3, UPrice4, UPrice5, UPrice6, UPrice7, UPrice8, UPrice9
    } = req.body;
    
    console.log('Received product data:', req.body);
    if (!productIdEdit) {
      const ProductExist = await Product.findOne({ ProductName: productName, Category: category });
      if (ProductExist) {
        return res.status(400).json({ message: 'Product already exists' });
      }
    }
    
    if (productIdEdit) {
      const ProductUpdate = await Product.findOneAndUpdate(
        { _id: productIdEdit },
        {
          $set: {
            ProductName: productName,
            Category: category,
            Title1,
            Title2,
            Title3,
            Title4,
            Title5,
            Title6,
            Title7,
            Title8,
            Title9,
            Price1,
            Price2,
            Price3,
            Price4,
            Price5,
            Price6,
            Price7,
            Price8,
            Price9,
            UPrice1,
            UPrice2,
            UPrice3,
            UPrice4,
            UPrice5,
            UPrice6,
            UPrice7,
            UPrice8,
            UPrice9
          }
        },
        { new: true, runValidators: true }
      );
      
      if (!ProductUpdate) {
        return res.status(400).json({ message: 'Product to update not found' });
      } else {
        return res.status(200).json({ message: 'Product updated successfully' });
      }
      
    } else {

      await Product.create({
        ProductName: productName,
        Category: category,
        Title1,
        Title2,
        Title3,
        Title4,
        Title5,
        Title6,
        Title7,
        Title8,
        Title9,
        Price1,
        Price2,
        Price3,
        Price4,
        Price5,
        Price6,
        Price7,
        Price8,
        Price9,
        UPrice1,
        UPrice2,
        UPrice3,
        UPrice4,
        UPrice5,
        UPrice6,
        UPrice7,
        UPrice8,
        UPrice9
      });

      res.status(201).json({ message: 'Product created successfully' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/auth/products', async (req, res) => {
  try {
    console.log('Fetching products', req.body);
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.log('Fetching products error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/auth/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    console.log('Deleting product error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;