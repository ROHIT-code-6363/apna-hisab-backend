const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    ProductName: { type: String, required: true },
    Category: { type: String },
    PriceParts: { type: Number },

    Title1: { type: String || Number },
    Title2: { type: String || Number },
    Title3: { type: String || Number },
    Title4: { type: String || Number },
    Title5: { type: String || Number },
    Title6: { type: String || Number },
    Title7: { type: String || Number },
    Title8: { type: String || Number },
    Title9: { type: String || Number },

    Price1: { type: Number },
    Price2: { type: Number },
    Price3: { type: Number },
    Price4: { type: Number },
    Price5: { type: Number },
    Price6: { type: Number },
    Price7: { type: Number },
    Price8: { type: Number },
    Price9: { type: Number },

    UPrice1: { type: Number },
    UPrice2: { type: Number },
    UPrice3: { type: Number },
    UPrice4: { type: Number },
    UPrice5: { type: Number },
    UPrice6: { type: Number },
    UPrice7: { type: Number },
    UPrice8: { type: Number },
    UPrice9: { type: Number },
});

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
