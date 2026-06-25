const express = require('express');
const router = express.Router();
const Bills = require('../models/Bills');
const Bills2 = require('../models/Bills2');
const KhataUser = require('../models/KhataUsers');
const Product = require('../models/productModule');
const LabelFormat = require('../models/LabelSize');

// Create a new bill
router.post('/saveBill', async (req, res) => {
    try {
        const { billNumber, status, items, totalAmount, cgst, sgst, discount, grandTotal, date, khataId, khataName, khataPhone, khataCity, retailBoxDiscount, ExtraDiscount, billType } = req.body;
        console.log('Received bill data:', req.body);
        if (!billNumber || !items || items.length === 0) {
            return res.status(400).json({ message: "Incomplete bill data" });
        }

        // Check duplicate bill number
        let existingBill;
        if (billType === 'bill2') {
            existingBill = await Bills2.findOne({ BillNo: billNumber });
        } else {
            existingBill = await Bills.findOne({ BillNo: billNumber });
        }
        if (existingBill) {
            return res.status(400).json({ message: "Bill number already exists", success: false });
        }

        const billDataToSave = {
            Date: date,
            BillNo: billNumber,
            status: status || 'Paid',
            Items: items,
            TaxableAmount: totalAmount,
            CGST: cgst,
            SGST: sgst,
            Discount: discount,
            GrandTotal: grandTotal,
            khataId: khataId || null,
            CustomerName: khataName || null,
            CustomerPhone: khataPhone || null,
            CustomerCity: khataCity || null,
            RetailBoxDiscount: retailBoxDiscount || 0,
            ExtraDiscount: ExtraDiscount || 0,
            billType: billType || 'bill1'
        };
        if (billType === 'bill2') {
            const newBill = new Bills2(billDataToSave);
            await newBill.save();
        } else {
            const newBill = new Bills(billDataToSave);
            await newBill.save();
        }
        res.status(200).json({ message: "Bill saved successfully", success: true });
    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ message: "saveBill pre kuch gadbad he backend" });
    }
});

// Backend API: Aakhiri bill number bhejne ke liye
router.get('/getLastBillNumber', async (req, res) => {
    try {
        const { type } = req.query;
        let lastBill;

        const query = { BillNo: { $exists: true, $ne: null, $ne: "" } };

        if (type === 'bill2') {
            lastBill = await Bills2.findOne(query).sort({ _id: -1 });
        } else {
            lastBill = await Bills.findOne(query).sort({ _id: -1 });
        }

        let lastNumber = 0;

        if (lastBill && lastBill.BillNo) {
            const extractedNumber = parseInt(lastBill.BillNo.replace(/[^0-9]/g, ''), 10);

            lastNumber = isNaN(extractedNumber) ? 0 : extractedNumber;
        }

        res.status(200).json({ success: true, lastNumber: lastNumber });

    } catch (error) {
        console.error("Fetch Bill Number Error:", error);
        res.status(500).json({ success: false, message: "Error fetching bill number" });
    }
});

// Get all bills
router.get('/getBills', async (req, res) => {
    try {
        const bills1 = await Bills2.find();
        const bills2 = await Bills.find();
        const allBills = [...bills1, ...bills2];
        res.status(200).json({ success: true, bills: allBills });
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

                const parts = item.SKU.split('_');
                const targetSKU = parts[0];
                const targetSize = parts[1];

                if (targetSKU) {
                    const product = await Product.findOne({ SKU: targetSKU });

                    const uniqueKey = item.SKU;

                    if (product && product.variants) {
                        const variant = product.variants.find(v => v.size === targetSize);
                        if (variant) {
                            stockData[uniqueKey] = variant.stock;
                        } else {
                            stockData[uniqueKey] = 0; // Variant delete ho gaya ho toh 0 bhej do
                        }
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
router.put('/updateBill', async (req, res) => {
    try {
        const { billId, billType } = req.query;
        const newBillData = req.body;

        let oldBill;

        if (billType === 'bill2') {
            oldBill = await Bills2.findById(billId);
        } else {
            oldBill = await Bills.findById(billId);
        }

        if (!oldBill) {
            return res.status(404).json({ success: false, message: "Bill not found" });
        }

        // ==========================================
        // STEP A: Purane items ka stock WAPAS PLUS (+) kar do
        const oldItems = oldBill.Items || oldBill.items || [];

        if (oldItems.length > 0) {
            for (let oldItem of oldItems) {
                const parts = oldItem.SKU.split('_');
                const targetSKU = parts[0];
                const targetSize = parts[1] || oldItem.size;

                const qtyToRevert = Number(oldItem.quantity || oldItem.qty || 0);

                if (targetSKU) {
                    const product = await Product.findOne({ SKU: targetSKU });
                    if (product && product.variants) {
                        const variant = product.variants.find(v => v.size === targetSize);
                        if (variant) {
                            variant.stock += qtyToRevert;
                            await product.save();
                        }
                    }
                }
            }
        }

        // ==========================================
        // STEP B: Naye items ka stock MINUS (-) kar do
        const newItems = newBillData.items || [];

        if (newItems.length > 0) {
            for (let newItem of newItems) {
                const parts = newItem.SKU.split('_');
                const targetSKU = parts[0];
                const targetSize = parts[1] || newItem.size;

                const qtyToMinus = Number(newItem.quantity || newItem.qty || 0);

                if (targetSKU) {
                    const product = await Product.findOne({ SKU: targetSKU });
                    if (product && product.variants) {
                        const variant = product.variants.find(v => v.size === targetSize);
                        if (variant) {
                            variant.stock -= qtyToMinus;
                            await product.save();
                        }
                    }
                }
            }
        }
        // ==========================================

        // STEP C: Ab aakhir mein apne Bill ko naye data se update kar do
        oldBill.Items = newBillData.items;
        oldBill.TaxableAmount = newBillData.totalAmount;
        oldBill.CGST = newBillData.cgst;
        oldBill.SGST = newBillData.sgst;
        oldBill.Discount = newBillData.discount;
        oldBill.RetailBoxDiscount = newBillData.retailBoxDiscount;
        oldBill.ExtraDiscount = newBillData.ExtraDiscount;
        oldBill.GrandTotal = newBillData.grandTotal;
        oldBill.billType = billType;

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

{/* LABEL SIZE ROUTES */ }
router.put('/saveLabelSize', async (req, res) => {
    try {
        const updateData = req.body;
        const updatedFormat = await LabelFormat.findOneAndUpdate(
            {},             // Filter
            updateData,     // Naya Data
            {
                new: true,    // Update ke baad naya data return kare
                upsert: true  // MAGIC: Agar data bilkul nahi hai (first time), to naya create kar de
            }
        );

        res.status(200).json({
            success: true,
            message: "Format updated successfully!",
            data: updatedFormat
        });
    } catch (error) {
        console.error("DB Error:", error);
        res.status(500).json({ success: false, message: "Server me problem aayi" });
    }
});

router.get('/getLabelSize', async (req, res) => {
    try {
        const format = await LabelFormat.findOne({});
        res.status(200).json(format);
    } catch (error) {
        console.error("DB Error:", error);
        res.status(500).json({ success: false, message: "Server me problem aayi" });
    }
});

module.exports = router;