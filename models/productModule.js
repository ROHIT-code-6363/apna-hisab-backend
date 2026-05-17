const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    image: { 
        type: String,
    }, 
    
    name: { 
        type: String, 
        required: true,
        unique: true
    }, 
    
    category: { 
        type: String, 
        required: true 
    }, 

    packOf: { 
        type: Number, 
        default: 1
    }, 
    
    variants: [{ 
        size: { 
            type: String,
            required: true 
        },
        stock: {
            type: Number,
            default: 0
        },
        udar: { 
            type: Number, 
            default: 0 
        },
        cash: { 
            type: Number, 
            default: 0 
        },
        retail: {
            type: Number,
            default: 0
        },
        RetaildiscountValue: {
            type: Number,
            default: 0
        }
    }],
}, { timestamps: true }); 

const Products = mongoose.model("Products", ProductSchema);
module.exports = Products;