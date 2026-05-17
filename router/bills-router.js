const express = require('express');
const router = express.Router();
const Bills = require('../models/Bills');
const KhataUser = require('../models/KhataUsers');
const Product = require('../models/productModule');

// Create a new bill
router.post('/saveBill', async (req, res) => {
    try {
        const { billNumber, status, items, totalAmount, cgst, sgst, discount, grandTotal, date, variantIndex, productId, khataId, khataName, khataPhone, khataCity, retailBoxDiscount, ExtraDiscount } = req.body;
        console.log('Received bill data:', req.body);
        if (!billNumber || !items || items.length === 0) {
            return res.status(400).json({ message: "Incomplete bill data" });
        }

        // Check duplicate bill number
        const existingBill = await Bills.findOne({ BillNo: billNumber });
        if (existingBill) {
            return res.status(400).json({ message: "Bill number already exists", success: false });
        }

        const newBill = new Bills({
            Date: date,
            BillNo: billNumber,
            status: status || 'Paid',
            Items: items,
            TaxableAmount: totalAmount,
            CGST: cgst,
            SGST: sgst,
            Discount: discount,
            GrandTotal: grandTotal,
            variantIndex: variantIndex,
            productId: productId,
            khataId: khataId || null,
            CustomerName: khataName || null,
            CustomerPhone: khataPhone || null,
            CustomerCity: khataCity || null,
            RetailBoxDiscount: retailBoxDiscount || 0,
            ExtraDiscount: ExtraDiscount || 0
        });
        await newBill.save();
        res.status(200).json({ message: "Bill saved successfully", success: true });
    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Backend API: Aakhiri bill number bhejne ke liye
router.get('/getLastBillNumber', async (req, res) => {
    try {
        const lastBill = await Bills.findOne().sort({ createdAt: -1 });

        let lastNumber = 0;

        if (lastBill && lastBill.BillNo) {

            lastNumber = parseInt(lastBill.BillNo.replace(/[^0-9]/g, ''), 10);
        }

        // Frontend ko aakhiri number bhej do
        res.status(200).json({ success: true, lastNumber: lastNumber });

    } catch (error) {
        console.error("Fetch Bill Number Error:", error);
        res.status(500).json({ success: false, message: "Error fetching bill number" });
    }
});

// Get all bills
router.get('/getBills', async (req, res) => {
    try {
        const bills = await Bills.find();
        res.status(200).json({ success: true, bills });
    } catch (error) {
        console.error("Fetch Bills Error:", error);
        res.status(500).json({ success: false, message: "Error fetching bills" });
    }
});

// Get Current Stock for Bill Items
router.post('/get-current-stocks', async (req, res) => {
    try {
        const { items } = req.body;
        let stockData = {}; // Ek dictionary banayenge stock store karne ke liye

        if (items && items.length > 0) {
            for (let item of items) {
                const targetId = item.productId || item._id;
                const targetVariantIndex = item.variantIndex !== undefined ? item.variantIndex : item.vIndex;

                if (targetId && targetVariantIndex !== undefined) {
                    const product = await Product.findById(targetId);
                    
                    // Ek unique key banayenge (jaise: "64abcd_0") aur usme stock save karenge
                    const uniqueKey = `${targetId}_${targetVariantIndex}`;
                    
                    if (product && product.variants && product.variants[targetVariantIndex]) {
                        stockData[uniqueKey] = product.variants[targetVariantIndex].stock;
                    } else {
                        stockData[uniqueKey] = 0; // Agar item delete ho gaya ho toh 0 bhej do
                    }
                }
            }
        }

        res.status(200).json({ success: true, stockData });

    } catch (error) {
        console.error("Fetch Stocks Error:", error);
        res.status(500).json({ success: false, message: "Stock fetch error" });
    }
});

// Update a bill
// router.put('/updateBill/:id', async (req, res) => {
//     try {
//         const billId = req.params.id;
//         const { items, totalAmount, cgst, sgst, discount, retailBoxDiscount, ExtraDiscount, grandTotal, variantIndex, productId } = req.body;

//         const updatedBill = await Bills.findByIdAndUpdate(billId, {
//             Items: items,
//             TaxableAmount: totalAmount,
//             CGST: cgst,
//             SGST: sgst,
//             Discount: discount,
//             GrandTotal: grandTotal,
// variantIndex: variantIndex,
// productId: productId,
//             RetailBoxDiscount: retailBoxDiscount,
//             ExtraDiscount: ExtraDiscount

//         }, { new: true });

//         if (!updatedBill) {
//             return res.status(404).json({ success: false, message: "Bill not found" });
//         }

//         res.status(200).json({ success: true, bill: updatedBill });
//     } catch (error) {
//         console.error("Update Bill Error:", error);
//         res.status(500).json({ success: false, message: "Error updating bill" });
//     }
// });

// Update a bill
router.put('/updateBill/:id', async (req, res) => {
    try {
        const billId = req.params.id;
        const newBillData = req.body; // NAYA: req.body ko newBillData me daal liya

        const oldBill = await Bills.findById(billId);

        if (!oldBill) {
            return res.status(404).json({ success: false, message: "Bill not found" });
        }

        // ==========================================
        // STEP A: Purane items ka stock WAPAS PLUS (+) kar do
        // Note: Check karein ki DB schema me 'Items' (capital I) hai ya 'items'
        const oldItems = oldBill.Items || oldBill.items || [];

        if (oldItems.length > 0) {
            for (let oldItem of oldItems) {
                const targetId = oldItem.productId || oldItem._id;
                const targetVariantIndex = oldItem.variantIndex !== undefined ? oldItem.variantIndex : oldItem.vIndex;

                if (targetId && targetVariantIndex !== undefined) {
                    const product = await Product.findById(targetId);
                    if (product) {
                        const qtyToRevert = Number(oldItem.quantity || oldItem.qty || 0);
                        // Purana stock wapas dukan me rakh diya (PLUS)
                        product.variants[targetVariantIndex].stock += qtyToRevert;
                        await product.save();
                    }

                }
            }
        }

        // ==========================================
        // STEP B: Naye items ka stock MINUS (-) kar do
        const newItems = newBillData.items || [];

        if (newItems.length > 0) {
            for (let newItem of newItems) {
                const targetId = newItem.productId || newItem._id;
                const targetVariantIndex = newItem.variantIndex !== undefined ? newItem.variantIndex : newItem.vIndex;

                if (targetId && targetVariantIndex !== undefined) {
                    const product = await Product.findById(targetId);
                    if (product) {
                        const qtyToMinus = Number(newItem.quantity || newItem.qty || 0);
                        // Naya stock dukan se nikal liya (MINUS)
                        product.variants[targetVariantIndex].stock -= qtyToMinus;
                        await product.save();
                    }
                }
            }
        }
        // ==========================================

        // STEP C: Ab aakhir mein apne Bill ko naye data se update kar do
        // Dhyan rakhein ki database keys (jaise Items, TaxableAmount) aapke schema se match karein
        oldBill.Items = newBillData.items;
        oldBill.variantIndex = newBillData.variantIndex;
        oldBill.productId = newBillData.productId;
        oldBill.TaxableAmount = newBillData.totalAmount;
        oldBill.CGST = newBillData.cgst;
        oldBill.SGST = newBillData.sgst;
        oldBill.Discount = newBillData.discount;
        oldBill.RetailBoxDiscount = newBillData.retailBoxDiscount;
        oldBill.ExtraDiscount = newBillData.ExtraDiscount;
        oldBill.GrandTotal = newBillData.grandTotal;

        // Agar frontend se variantIndex aur productId bill level par aa raha hai, tabhi ise use karein
        if (newBillData.variantIndex !== undefined) oldBill.variantIndex = newBillData.variantIndex;
        if (newBillData.productId) oldBill.productId = newBillData.productId;

        await oldBill.save();

        // NAYA: Sirf ek baar response bhejein
        res.status(200).json({ success: true, message: "Bill aur Stock dono perfect update ho gaye!" });

    } catch (error) {
        console.error("Update Bill Error:", error);
        res.status(500).json({ success: false, message: "Error updating bill" });
    }
});

// Transaction Amount Update API
router.put('/update-transaction-amount/:userid', async (req, res) => {
    try {
        const { userid } = req.params;
        const { billno, date, oldAmount, newAmount } = req.body;

        // STEP 1: Pehle pata lagao ke KhataUser correct hai ya nahi
        const user = await KhataUser.findById(userid);
        if (!user) {
            return res.status(404).json({ message: "Khata User nahi mila!" });
        }

        let targetTxn = null;
        let targetBill = user.bills.find(bill => {
            // Bill ke andar us transaction ko dhoondho
            targetTxn = bill.transactions.find(txn =>
                txn.billno === billno &&
                txn.date === date &&
                txn.amount === Number(oldAmount)
            );
            return targetTxn != null;
        });

        if (!targetBill || !targetTxn) {
            return res.status(404).json({ message: "BillNumber, Date ya Amount match nahi hua!" });
        }

        // STEP 3: Mil gaya! Check karo ki type sirf 'Bill' ho
        if (targetTxn.type !== 'Bill') {
            return res.status(400).json({ message: "Sirf 'Bill' type ke transaction update ho sakte hain!" });
        }

        // Purana amount minus karo aur naya amount direct plus kar do
        targetBill.totalAmount = (targetBill.totalAmount - Number(oldAmount)) + Number(newAmount);
        user.grandTotal = (user.grandTotal - Number(oldAmount)) + Number(newAmount);

        // Transaction ke andar naya amount set kar do
        targetTxn.amount = Number(newAmount);

        // Database mein Save kar do
        await user.save();

        res.status(200).json({
            message: "Transaction amount successfully update ho gaya!",
            updatedGrandTotal: user.grandTotal
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a bill
router.delete('/deleteBill/:id', async (req, res) => {
    try {
        const billId = req.params.id;
        const deletedBill = await Bills.findByIdAndDelete(billId);
        if (!deletedBill) {
            return res.status(404).json({ success: false, message: "Bill not found" });
        }
        res.status(200).json({ success: true, message: "Bill deleted successfully" });
    }
    catch (error) {
        console.error("Delete Bill Error:", error);
        res.status(500).json({ success: false, message: "Error deleting bill" });
    }
});

module.exports = router;