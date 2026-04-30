const express = require('express');
const router = express.Router();
const Bills = require('../models/Bills');
const KhataUser = require('../models/KhataUsers');

// Create a new bill
router.post('/saveBill', async (req, res) => {
    try {
        const { billNumber, status, items, totalAmount, cgst, sgst, discount, grandTotal, date, variantIndex, productId, khataId, khataName, khataPhone, khataCity, retailBoxDiscount } = req.body;
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
            RetailBoxDiscount: retailBoxDiscount || 0
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

// Update a bill
router.put('/updateBill/:id', async (req, res) => {
    try {
        const billId = req.params.id;
        const { items, totalAmount, cgst, sgst, discount, retailBoxDiscount ,grandTotal, variantIndex, productId } = req.body;

        const updatedBill = await Bills.findByIdAndUpdate(billId, {
            Items: items,
            TaxableAmount: totalAmount,
            CGST: cgst,
            SGST: sgst,
            Discount: discount,
            GrandTotal: grandTotal,
            variantIndex: variantIndex,
            productId: productId,
            RetailBoxDiscount: retailBoxDiscount

        }, { new: true });

        if (!updatedBill) {
            return res.status(404).json({ success: false, message: "Bill not found" });
        }

        res.status(200).json({ success: true, bill: updatedBill });
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