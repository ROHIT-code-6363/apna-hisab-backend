const mongoose = require("mongoose");

const KhataUsersSchema = new mongoose.Schema({
    profileColor: {type: String},
    name: { type: String, required: true },
    phone: { type: Number, unique: true },
    city: { type: String, required: true },
    totalAmount: { type: Number, default: 0 },

    transactions: [{
        amount: { type: Number, required: true },
        type: { type: String, required: true },
        paymentMethod: { type: String },
        billno: {type: String},
        date: { type: String, required: true },
        time: {type: String},
        discount: { type: Number, default: 0 },

    }]
},{ timestamps: true });

const KhataUser = mongoose.model("KhataUser", KhataUsersSchema);
module.exports = KhataUser;