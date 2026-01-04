const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    image: { 
        type: String,
    }, 
    
    name: { 
        type: String, 
        required: true 
    }, 
    
    category: { 
        type: String, 
        required: true 
    }, 
    
    variants: [{ 
        size: { 
            type: String,
            required: true 
        },
        cash: { 
            type: Number, 
            default: 0 
        },
        udar: { 
            type: Number, 
            default: 0 
        },
    }],
}, { timestamps: true }); 

const Products = mongoose.model("Products", ProductSchema);
module.exports = Products;