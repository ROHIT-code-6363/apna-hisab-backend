const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    type: { type: String, required: true }, 
    paymentMethod: { type: String },
    billno: { type: String },
    date: { type: String, required: true },
    time: { type: String },
    discount: { type: Number, default: 0 }
}, { _id: true });

const KhataUsersSchema = new mongoose.Schema({
    profileColor: {type: String},
    name: { type: String, required: true },
    phone: { type: Number, unique: true },
    city: { type: String, required: true },
    grandTotal: { type: Number, default: 0 },
    isMultiBill: { type: Boolean, default: false },
    maxActiveBill: { type: Number, default: 3 },

    bills: [{
        billAmount: {type: Number},
        note: { type: String, default: null },
        status: { type: String, default: 'Active' },   // Active, Paid, Cancelled
        totalAmount: { type: Number, default: 0 },      
        
        // ** Transactions ab yaha aayenge **
        transactions: [transactionSchema] 
    }]
},{ timestamps: true });

const KhataUser = mongoose.model("KhataUser", KhataUsersSchema);
module.exports = KhataUser;