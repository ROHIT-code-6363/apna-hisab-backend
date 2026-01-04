const express = require('express');
const router = express.Router();
const KhataUser = require('../models/KhataUsers');


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

{/* USER DELETE */ }
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

{/* USER PAYMENT SCREEN DATA */ }
router.post('/add-transaction', async (req, res) => {
    try {
        const { phone, amount, type, paymentType, discount, date, billno } = req.body;
        console.log("Received Bill No:", billno);
        
        const now = new Date().toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata', // India Timezone
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const serverTime = now.toUpperCase();

        const user = await KhataUser.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: "add/transaction => User not found" });
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

        user.transactions.push(newTransaction);

        if (type === 'Bill') {
            user.totalAmount += Number(amount);

            if (discount && Number(discount) > 0) {
                user.totalAmount -= Number(discount);
            }
        } else if (type === 'Pay') {
            user.totalAmount -= Number(amount);

            if (discount && Number(discount) > 0) {
                user.totalAmount -= Number(discount);
            }
        }

        await user.save();

        res.status(200).json({ message: "Transaction Added", updatedBalance: user.totalAmount, user: newTransaction });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/get-transaction/:phone', async (req, res) => {
    try {
        const { phone } = req.params;

        const user = await KhataUser.findOne({ phone });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.transactions);

    } catch (error) {
        console.log('Fetching UserTransactions error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

{/* USER TRANSCATION DELETE */ }
router.delete('/delete-transaction/:id', async (req, res) => {
    try {
        const transactionId = req.params.id;

        const user = await KhataUser.findOne({ "transactions._id": transactionId });

        if (!user) {
            return res.status(404).json({ message: "Transaction or User not found" });
        }

        const transactionIndex = user.transactions.findIndex(
            (t) => t._id.toString() === transactionId
        );

        if (transactionIndex === -1) {
            return res.status(404).json({ message: "Transaction not found inside user" });
        }

        const transactionToDelete = user.transactions[transactionIndex];

        const amount = Number(transactionToDelete.amount) || 0;
        const discount = Number(transactionToDelete.discount) || 0;

        if (transactionToDelete.type === 'Bill') {
            user.totalAmount -= (amount - discount);
        } else {
            user.totalAmount += (amount + discount);
        }

        user.transactions.splice(transactionIndex, 1);
        await user.save();

        res.status(200).json({
            message: "Transaction deleted and Balance updated",
            updatedBalance: user.totalAmount
        });

    } catch (error) {
        console.error("Delete API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Update Transaction API
router.put('/update-transaction/:id', async (req, res) => {
    try {
        const transactionId = req.params.id;
        const { date, amount, discount, paymentMethod, billNo } = req.body;

        
        const user = await KhataUser.findOne({ "transactions._id": transactionId });

        if (!user) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        
        const transIndex = user.transactions.findIndex(t => t._id.toString() === transactionId);
        const oldTrans = user.transactions[transIndex];

        //  --- BALANCE RECALCULATION LOGIC ---
        
        let oldTotal = Number(oldTrans.amount) - (Number(oldTrans.discount) || 0);
        if (oldTrans.type === 'Bill') {
            user.totalAmount -= oldTotal;
        } else {
            user.totalAmount += oldTotal; 
        }

        // Transaction values update karo
        user.transactions[transIndex].date = date;
        user.transactions[transIndex].amount = amount;
        user.transactions[transIndex].discount = discount;
        user.transactions[transIndex].paymentMethod = paymentMethod;
        user.transactions[transIndex].billno = billNo; 

        // C. Ab naya amount balance me jodo
        let newTotal = Number(amount) - (Number(discount) || 0);
        if (oldTrans.type === 'Bill') {
            user.totalAmount += newTotal; // Naya bill add karo
        } else {
            user.totalAmount -= newTotal; // Nayi payment minus karo
        }

        await user.save();

        res.status(200).json({ 
            message: "Updated successfully", 
            updatedBalance: user.totalAmount 
        });

    } catch (error) {
        console.error("Update API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;