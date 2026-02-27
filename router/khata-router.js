const express = require('express');
const router = express.Router();
const KhataUser = require('../models/KhataUsers');

{/* ---ADDING KHATAUSER--- */ }
router.post('/AddKhataUser', async (req, res) => {
    try {
        const { name, phone, city } = req.body;

        const existingUser = await KhataUser.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this phone number" });
        }

        const colors = ['#F87171', '#34D399', '#60A5FA', '#FBBF24', '#A78BFA', '#F472B6', '#10B981', '#8B5CF6'];
        const randomProfileColor = colors[Math.floor(Math.random() * colors.length)];

        const newUser = new KhataUser({
            name,
            phone,
            city,
            profileColor: randomProfileColor,
        });

        await newUser.save();
        res.status(201).json({ message: "User Added Successfully", user: newUser });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

{/* ---UPDATE KHATAUSER--- */ }
router.put('/AddKhataUser/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { name, phone, city } = req.body;

        const updatedUser = await KhataUser.findByIdAndUpdate(
            id,
            { name, phone, city },
            { new: true } // Iska matlab hai ki response mein updated (naya) data wapas mile
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User nahi mila (User not found)" });
        }

        // Success
        res.status(200).json({
            message: "User Updated Successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: error.message });
    }
});

{/* KHATAUSER DELETE */ }
router.delete('/KhataUserDelete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await KhataUser.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Deleted successfully" });

    } catch (error) {
        console.error("Delete API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

{/* MULTI BILLS ISACTIVE */ }
router.put('/User-Profile/:id', async (req, res) => {
  const { id } = req.params;
  const { isMultiBill, maxActiveBill } = req.body;

  // basic validation
  if (typeof maxActiveBill !== 'undefined') {
    if (!Number.isInteger(maxActiveBill) || maxActiveBill < 1 || maxActiveBill > 99) {
      return res.status(400).json({ message: "maxActiveBill must be an integer between 1 and 99" });
    }
  }

  const updated = await KhataUser.findByIdAndUpdate(id, { isMultiBill, ...(maxActiveBill !== undefined && { maxActiveBill }) }, { new: true });
  return res.json(updated);
});

{/* USER PROFILE GET */ }
router.get('/User-Profile/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await KhataUser.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);

    } catch (error) {
        console.log('Fetching KhataUser error:', error.message);

        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid User ID format' });
        }

        res.status(500).json({ message: 'Server error' });
    }
});

{/* USER GET */ }
router.get('/getKhataUser', async (req, res) => {
    try {
        const KhataUsers = await KhataUser.find();
        res.status(200).json(KhataUsers);
    } catch (error) {
        console.log('Fetching KhataUser error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
})

{/* ADDING USER PAYMENTS */ }
router.post('/add-transaction/:userid', async (req, res) => {

    try {
        const { userid } = req.params;
        const { amount, type, paymentType, discount, date, billno } = req.body;
        const { billId } = req.query;

        const user = await KhataUser.findById(userid);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const now = new Date().toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true
        });
        const serverTime = now.toUpperCase();

        let targetBill;

        // --- Bill Logic Shuru ---

        if (billId && billId !== 'undefined' && billId !== 'null') {
            targetBill = user.bills.id(billId);
        }

        if (!targetBill) {

            if (user.bills.length === 0) {
                user.bills.unshift({
                    note: 'General Bill',
                    status: 'Active',
                    totalAmount: 0,
                    transactions: [],
                });
            }
            targetBill = user.bills[0];
        }


        if (!targetBill) {
            return res.status(404).json({ message: "Bill not found inside user" });
        }

        const newTransaction = {
            billno: billno,
            amount: Number(amount),
            type: type,
            paymentMethod: paymentType,
            discount: Number(discount) || 0,
            date: date,
            time: serverTime
        };

        targetBill.transactions.push(newTransaction);

        if (type === 'Bill') {
            targetBill.totalAmount += Number(amount);

            if (user.grandTotal !== undefined) user.grandTotal += Number(amount);

            if (Number(discount) > 0) {
                targetBill.totalAmount -= Number(discount);
                if (user.grandTotal !== undefined) user.grandTotal -= Number(discount);
            }
        } else if (type === 'Pay') {
            targetBill.totalAmount -= Number(amount);

            if (user.grandTotal !== undefined) user.grandTotal -= Number(amount);

            if (Number(discount) > 0) {
                targetBill.totalAmount -= Number(discount);
                if (user.grandTotal !== undefined) user.grandTotal -= Number(discount)
            }
        }

        if (targetBill.totalAmount <= 0) {
            targetBill.status = 'Closed';
        } else {
            targetBill.status = 'Active';
        }

        await user.save();

        res.status(200).json({
            message: "Transaction Added",
            updatedBillTotal: targetBill.totalAmount,
            updatedGlobalBalance: user.grandTotal,
            transaction: newTransaction
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

{/* GETING USER TRANSACTIONS */ }
router.get('/get-transaction/:userid', async (req, res) => {
    try {
        const { userid } = req.params;
        const { billId } = req.query;
        // console.log('billId', billId)

        const user = await KhataUser.findById(userid);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let selectedBill;


        if (billId) {
            selectedBill = user.bills.id(billId);
        } else {

            selectedBill = user.bills.length > 0 ? user.bills[0] : null;
        }

        if (!selectedBill) {
            return res.status(404).json({ message: "Bill not found" });
        }

        res.status(200).json({
            // billAmount: selectedBill.billAmount,
            note: selectedBill.note,
            status: selectedBill.status,
            totalAmount: selectedBill.totalAmount,
            transactions: selectedBill.transactions
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

{/* ADDING NEW BILL */ }
router.post('/add-bill', async (req, res) => {
    try {

        const { userId, amount, billNo, note, date } = req.body;

        if (!userId || !amount || !billNo) {
            return res.status(400).json({ message: "UserId, Amount and BillNo are required" });
        }

        const user = await KhataUser.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const newBill = {
            note: note || "New Bill",
            status: "Active",
            totalAmount: Number(amount),
            transactions: [
                {
                    amount: Number(amount),
                    billno: billNo,
                    date: date,
                    type: "Bill"
                }
            ]
        };

        user.bills.push(newBill);

        user.grandTotal = (user.grandTotal || 0) + Number(amount);

        await user.save();

        res.status(200).json({ message: "Bill added successfully", data: user });

    } catch (error) {
        console.error("Error adding bill:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

{/* GETING USER BILLS */ }
router.get('/get-all-bills/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await KhataUser.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            profileColor: user.profileColor,
            name: user.name,
            phone: String(user.phone),
            city: user.city,
            grandTotal: user.grandTotal,
            isMultiBill: user.isMultiBill,
            maxActiveBill: user.maxActiveBill,
            bills: user.bills
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

{/* USER TRANSCATION DELETE */ }
router.delete('/delete-transaction/:id', async (req, res) => {
    try {
        const transactionId = req.params.id;

        const user = await KhataUser.findOne({ "bills.transactions._id": transactionId });

        if (!user) {
            return res.status(404).json({ message: "Transaction or User not found" });
        }

        let targetBill = null;
        let targetTrans = null;

        for (let bill of user.bills) {

            targetTrans = bill.transactions.id(transactionId);
            if (targetTrans) {
                targetBill = bill;
                break;
            }
        }

        if (!targetBill || !targetTrans) {
            return res.status(404).json({ message: "Transaction not found inside bill" });
        }

        const netValue = Number(targetTrans.amount) - Number(targetTrans.discount) || 0;

        if (targetTrans.type === 'Bill') {

            targetBill.totalAmount -= netValue;
            if (user.grandTotal !== undefined) user.grandTotal -= netValue;

        } else if (targetTrans.type === 'Pay') {

            targetBill.totalAmount += netValue;
            if (user.grandTotal !== undefined) user.grandTotal += netValue;
        }

        targetBill.transactions.pull(transactionId);

        await user.save();

        res.status(200).json({
            message: "Transaction deleted successfully",
            updatedBillTotal: targetBill.totalAmount,
            updatedGlobalBalance: user.grandTotal
        });

    } catch (error) {
        console.error("Delete API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

{/* USER TRANSCATION UPDATE */ }
router.put('/update-transaction/:id', async (req, res) => {
    try {
        const transactionId = req.params.id;
        const { date, amount, discount, paymentMethod, billNo } = req.body;

        const user = await KhataUser.findOne({ "bills.transactions._id": transactionId });

        if (!user) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        let targetBill = null;
        let targetTrans = null;

        for (let bill of user.bills) {
            targetTrans = bill.transactions.id(transactionId);
            if (targetTrans) {
                targetBill = bill;
                break; // Mil gaya, loop roko
            }
        }

        if (!targetBill || !targetTrans) {
            return res.status(404).json({ message: "Transaction data missing" });
        }

        // A. Purana Asar Hatao (Revert Old Values)
        const oldAmountVal = Number(targetTrans.amount);
        const oldDiscountVal = Number(targetTrans.discount) || 0;
        const netOldTotal = oldAmountVal - oldDiscountVal;

        if (targetTrans.type === 'Bill') {
            const netOldTotal = oldAmountVal - oldDiscountVal;

            targetBill.totalAmount -= netOldTotal;     // Bill total kam karo
            if (user.grandTotal !== undefined) user.grandTotal -= netOldTotal; // User total kam karo
        } else if (targetTrans.type === 'Pay') {
            const netOldTotal = oldAmountVal + oldDiscountVal;

            targetBill.totalAmount += netOldTotal;     // Payment thi, wapas add karo (udhar badha)
            if (user.grandTotal !== undefined) user.grandTotal += netOldTotal;
        };

        // B. Transaction Data Update Karo
        targetTrans.date = date;
        targetTrans.amount = amount;
        targetTrans.discount = discount;
        targetTrans.paymentMethod = paymentMethod;
        targetTrans.billno = billNo;

        // C. Naya Asar Dalo (Apply New Values)
        const newAmountVal = Number(amount);
        const newDiscountVal = Number(discount) || 0;
        const netNewTotal = newAmountVal - newDiscountVal;

        if (targetTrans.type === 'Bill') {
            const netNewTotal = newAmountVal - newDiscountVal;

            targetBill.totalAmount += netNewTotal;
            if (user.grandTotal !== undefined) user.grandTotal += netNewTotal;
        } else if (targetTrans.type === 'Pay') {
            const netNewTotal = newAmountVal + newDiscountVal;

            targetBill.totalAmount -= netNewTotal;
            if (user.grandTotal !== undefined) user.grandTotal -= netNewTotal;
        }

        await user.save();

        res.status(200).json({
            message: "Updated successfully",
            updatedBillTotal: targetBill.totalAmount,
            updatedGlobalBalance: user.grandTotal
        });

    } catch (error) {
        console.error("Update API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

{/* DELETE MULTIPLE BILLS */ }
router.post('/delete-bills', async (req, res) => {
    try {
        const { billIds, userId } = req.body;

        if (!billIds || billIds.length === 0 || !userId) {
            return res.status(400).json({ message: "Invalid request - billIds and userId required" });
        }

        const user = await KhataUser.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Calculate total amount to subtract from grandTotal
        let totalToSubtract = 0;

        // Filter out the bills to delete and calculate their total amounts
        billIds.forEach(billId => {
            const billToDelete = user.bills.id(billId);
            if (billToDelete) {
                totalToSubtract += billToDelete.totalAmount;
            }
        });

        // Remove bills from user
        user.bills = user.bills.filter(bill => !billIds.includes(bill._id.toString()));

        // Update grandTotal
        if (user.grandTotal !== undefined) {
            user.grandTotal -= totalToSubtract;
        }

        await user.save();

        res.status(200).json({
            message: `${billIds.length} bill(s) deleted successfully`,
            updatedGrandTotal: user.grandTotal,
            deletedCount: billIds.length
        });

    } catch (error) {
        console.error("Delete Bills Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
