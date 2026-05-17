const mongoose = require("mongoose");

const BillSchema = new mongoose.Schema({
    CustomerName: { type: String },
    CustomerPhone: { type: Number },
    CustomerCity: { type: String },
    BillNo: { type: String, required: true, unique: true },
    Date: { type: String, required: true },
    status: {
        type: String,
        enum: ['Paid', 'Udhar'],
        default: 'Paid'
    },
    khataId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KhataUser', 
        required: function () {
            return this.status === 'Udhar';
        },
        default: null
    },
    Items: [{
        productId: { type: String, required: true },
        variantIndex: { type: Number, required: true },
        name: { type: String, required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        priceType: {type: String, required: true},
        total: { type: Number, required: true },
        packOf: {type: Number},
        RetaildiscountValue: {type: Number}
    }],
    TaxableAmount: { type: Number, required: true },
    Discount: { type: Number, default: 0 },
    RetailBoxDiscount: { type: Number, default: 0 },
    ExtraDiscount: { type: Number, default: 0 },
    CGST: { type: Number, required: true },
    SGST: { type: Number, required: true },
    GrandTotal: { type: Number, required: true },
}, { timestamps: true });

const Bill = mongoose.model("Bill", BillSchema);
module.exports = Bill;