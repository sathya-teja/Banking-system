const express = require('express');
const { db, initDb } = require('./db');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const cors = require("cors");

const app = express();
const PORT = 3000;
app.use(cors());

app.use(express.json());
initDb();

// --- Utility: Calculate EMI ---
function calculateLoan(principal, years, rate) {
  const interest = principal * years * (rate / 100);
  const total = principal + interest;
  const emi = +(total / (years * 12)).toFixed(2);
  return { interest, total, emi };
}

// ✅ 1. LEND
app.post('/api/v1/loans', [
  body('customer_id').notEmpty(),
  body('loan_amount').isFloat({ gt: 0 }),
  body('loan_period_years').isInt({ gt: 0 }),
  body('interest_rate_yearly').isFloat({ gt: 0 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { customer_id, loan_amount, loan_period_years, interest_rate_yearly } = req.body;
  const { interest, total, emi } = calculateLoan(loan_amount, loan_period_years, interest_rate_yearly);
  const loan_id = uuidv4();

  db.get(`SELECT * FROM Customers WHERE customer_id = ?`, [customer_id], (err, customer) => {
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found. Please register first.' });
    }

    db.run(`INSERT INTO Loans (loan_id, customer_id, principal_amount, total_amount, interest_rate, loan_period_years, monthly_emi)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [loan_id, customer_id, loan_amount, total, interest_rate_yearly, loan_period_years, emi],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        res.status(201).json({
          loan_id,
          customer_id,
          total_amount_payable: total,
          monthly_emi: emi
        });
      });
  });
});

// ✅ 2. PAYMENT
app.post('/api/v1/loans/:loan_id/payments', [
  body('amount').isFloat({ gt: 0 }),
  body('payment_type').isIn(['EMI', 'LUMP_SUM'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { loan_id } = req.params;
  const { amount, payment_type } = req.body;
  const payment_id = uuidv4();

  db.get(`SELECT * FROM Loans WHERE loan_id = ?`, [loan_id], (err, loan) => {
    if (err || !loan) return res.status(404).json({ error: 'Loan not found' });

    const new_total = loan.total_amount - amount;
    const emis_left = Math.ceil(new_total / loan.monthly_emi);

    db.run(`INSERT INTO Payments (payment_id, loan_id, amount, payment_type) VALUES (?, ?, ?, ?)`,
      [payment_id, loan_id, amount, payment_type], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        db.run(`UPDATE Loans SET total_amount = ?, status = ? WHERE loan_id = ?`,
          [Math.max(new_total, 0), new_total <= 0 ? 'PAID_OFF' : 'ACTIVE', loan_id]);

        res.status(200).json({
          payment_id,
          loan_id,
          message: 'Payment recorded successfully.',
          remaining_balance: Math.max(new_total, 0),
          emis_left
        });
      });
  });
});

// ✅ 3. LEDGER
app.get('/api/v1/loans/:loan_id/ledger', (req, res) => {
  const { loan_id } = req.params;

  db.get(`SELECT * FROM Loans WHERE loan_id = ?`, [loan_id], (err, loan) => {
    if (err || !loan) return res.status(404).json({ error: 'Loan not found' });

    db.all(`SELECT * FROM Payments WHERE loan_id = ?`, [loan_id], (err2, payments) => {
      const paid = payments.reduce((sum, tx) => sum + tx.amount, 0);
      const balance = loan.total_amount;
      const full_interest = loan.principal_amount * loan.loan_period_years * (loan.interest_rate / 100);
      const original_total = loan.principal_amount + full_interest;

      res.status(200).json({
        loan_id: loan.loan_id,
        customer_id: loan.customer_id,
        principal: loan.principal_amount,
        total_amount: original_total,
        monthly_emi: loan.monthly_emi,
        amount_paid: paid,
        balance_amount: balance,
        emis_left: Math.ceil(balance / loan.monthly_emi),
        transactions: payments
      });
    });
  });
});

// ✅ 4. ACCOUNT OVERVIEW
app.get('/api/v1/customers/:customer_id/overview', (req, res) => {
  const { customer_id } = req.params;

  db.all(`SELECT * FROM Loans WHERE customer_id = ?`, [customer_id], (err, loans) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!loans.length) return res.status(404).json({ error: 'No loans found for customer' });

    let result = {
      customer_id,
      total_loans: loans.length,
      loans: []
    };

    let completed = 0;
    loans.forEach(loan => {
      db.all(`SELECT * FROM Payments WHERE loan_id = ?`, [loan.loan_id], (err2, payments) => {
        const amount_paid = payments.reduce((sum, tx) => sum + tx.amount, 0);
        const total_interest = (loan.principal_amount * loan.loan_period_years * (loan.interest_rate / 100));
        const total_amount = loan.principal_amount + total_interest;
        const balance_amount = loan.total_amount;
        const emis_left = Math.ceil(balance_amount / loan.monthly_emi);

        result.loans.push({
          loan_id: loan.loan_id,
          principal: loan.principal_amount,
          total_amount,
          total_interest,
          emi_amount: loan.monthly_emi,
          amount_paid,
          balance_amount,
          emis_left
        });

        if (++completed === loans.length) {
          res.status(200).json(result);
        }
      });
    });
  });
});

// Optional: Add customer (helper endpoint for testing)
app.post('/api/v1/customers', [
  body('customer_id').notEmpty(),
  body('name').notEmpty()
], (req, res) => {
  const { customer_id, name } = req.body;
  db.run(`INSERT INTO Customers (customer_id, name) VALUES (?, ?)`, [customer_id, name], (err) => {
    if (err) return res.status(400).json({ error: 'Customer already exists' });
    res.status(201).json({ message: 'Customer created' });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
