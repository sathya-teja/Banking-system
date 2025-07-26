import React, { useState } from "react";
import axios from "axios";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FaUser,
  FaWallet,
  FaChartPie,
  FaUniversity,
} from "react-icons/fa";
import { MdAttachMoney, MdPayments } from "react-icons/md";

export default function BankApp() {
  const [customerId, setCustomerId] = useState("cust001");
  const [loanForm, setLoanForm] = useState({ amount: "", years: "", rate: "" });
  const [paymentForm, setPaymentForm] = useState({
    loanId: "",
    amount: "",
    type: "LUMP_SUM",
  });
  const [ledgerData, setLedgerData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [tab, setTab] = useState("lend");

  const api = "http://localhost:3000/api/v1";

  const handleLoanSubmit = async () => {
    try {
      const res = await axios.post(`${api}/loans`, {
        customer_id: customerId,
        loan_amount: Number(loanForm.amount),
        loan_period_years: Number(loanForm.years),
        interest_rate_yearly: Number(loanForm.rate),
      });
      alert("Loan Created: " + res.data.loan_id);
    } catch (err) {
      alert(
        "Failed to create loan. " + (err?.response?.data?.error || err.message)
      );
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      const res = await axios.post(
        `${api}/loans/${paymentForm.loanId}/payments`,
        {
          amount: Number(paymentForm.amount),
          payment_type: paymentForm.type,
        }
      );
      alert("Payment Success. Balance: ₹" + res.data.remaining_balance);
    } catch (err) {
      alert(
        "Payment failed. " + (err?.response?.data?.error || err.message)
      );
    }
  };

  const fetchLedger = async (loanId) => {
    if (!loanId?.trim()) return;
    try {
      const res = await axios.get(`${api}/loans/${loanId}/ledger`);
      setLedgerData(res.data);
    } catch (err) {
      alert(
        "Failed to fetch ledger. " + (err?.response?.data?.error || err.message)
      );
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await axios.get(`${api}/customers/${customerId}/overview`);
      setOverviewData(res.data);
    } catch (err) {
      alert(
        "Failed to fetch overview. " + (err?.response?.data?.error || err.message)
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-900 text-white p-5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3 text-2xl font-extrabold tracking-wide select-none">
          <FaUniversity className="text-3xl" />
          Bank Lending System
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
        {/* Customer ID Input */}
        <div className="mb-10 max-w-sm">
          <label className="block font-semibold text-blue-900 mb-3 flex items-center gap-2 text-lg">
            <FaUser />
            Customer ID
          </label>
          <Input
            placeholder="Enter Customer ID"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full border-blue-400 focus:ring-blue-500 focus:border-blue-600"
          />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-3 rounded-md border border-blue-300 bg-white shadow-sm px-3 text-blue-900">
            {[ 
              { value: "lend", icon: MdAttachMoney, label: "Lend" }, 
              { value: "pay", icon: MdPayments, label: "Payment" }, 
              { value: "ledger", icon: FaWallet, label: "Ledger" }, 
              { value: "overview", icon: FaChartPie, label: "Overview" }
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 flex items-center gap-1 px-5 py-2 rounded-md transition-colors duration-150 
                hover:bg-blue-500 hover:text-white cursor-pointer"
              >
                <Icon className="text-lg" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Lend Tab */}
          <TabsContent value="lend">
            <Card className="shadow-md border border-blue-200 rounded-lg">
              <CardContent className="space-y-5 pt-6 px-8 pb-10">
                <Input
                  placeholder="Loan Amount"
                  type="number"
                  value={loanForm.amount}
                  onChange={(e) =>
                    setLoanForm({ ...loanForm, amount: e.target.value })
                  }
                  className="border-blue-300 focus:ring-blue-400 focus:border-blue-500 rounded-md px-4 py-3"
                />
                <Input
                  placeholder="Loan Period (Years)"
                  type="number"
                  value={loanForm.years}
                  onChange={(e) =>
                    setLoanForm({ ...loanForm, years: e.target.value })
                  }
                  className="border-blue-300 focus:ring-blue-400 focus:border-blue-500 rounded-md px-4 py-3"
                />
                <Input
                  placeholder="Interest Rate (%)"
                  type="number"
                  value={loanForm.rate}
                  onChange={(e) =>
                    setLoanForm({ ...loanForm, rate: e.target.value })
                  }
                  className="border-blue-300 focus:ring-blue-400 focus:border-blue-500 rounded-md px-4 py-3"
                />
                <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg rounded-lg transition" onClick={handleLoanSubmit}>
                  Create Loan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="pay">
            <Card className="shadow-md border border-blue-200 rounded-lg">
              <CardContent className="space-y-5 pt-6 px-8 pb-10">
                <Input
                  placeholder="Loan ID"
                  value={paymentForm.loanId}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, loanId: e.target.value })
                  }
                  className="border-green-300 focus:ring-green-400 focus:border-green-500 rounded-md px-4 py-3"
                />
                <Input
                  placeholder="Amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  className="border-green-300 focus:ring-green-400 focus:border-green-500 rounded-md px-4 py-3"
                />
                <select
                  value={paymentForm.type}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, type: e.target.value })
                  }
                  className="border-green-300 rounded-md p-3 w-full focus:ring-green-400 focus:border-green-500"
                >
                  <option value="EMI">EMI</option>
                  <option value="LUMP_SUM">LUMP_SUM</option>
                </select>
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 shadow-lg rounded-lg transition"
                  onClick={handlePaymentSubmit}
                >
                  Make Payment
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ledger Tab */}
          <TabsContent value="ledger">
            <Card className="shadow-md border border-blue-200 rounded-lg">
              <CardContent className="space-y-5 pt-6 px-8 pb-10">
                <Input
                  placeholder="Enter Loan ID"
                  onBlur={(e) => fetchLedger(e.target.value)}
                  className="border-blue-300 focus:ring-blue-400 focus:border-blue-500 rounded-md px-4 py-3"
                />
                {ledgerData ? (
                  <div className="space-y-3 text-gray-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <p>
                        <span className="font-semibold">Principal:</span> ₹
                        {ledgerData.principal}
                      </p>
                      <p>
                        <span className="font-semibold">Total Amount:</span> ₹
                        {ledgerData.total_amount}
                      </p>
                      <p>
                        <span className="font-semibold">Amount Paid:</span> ₹
                        {ledgerData.amount_paid}
                      </p>
                      <p>
                        <span className="font-semibold">Balance:</span> ₹
                        {ledgerData.balance_amount}
                      </p>
                      <p>
                        <span className="font-semibold">EMIs Left:</span>{" "}
                        {ledgerData.emis_left}
                      </p>
                    </div>
                    {ledgerData.transactions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-2">
                          Transactions
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 max-h-48 overflow-y-auto">
                          {ledgerData.transactions.map((tx) => (
                            <li key={tx.payment_id}>
                              <span className="font-medium">{tx.payment_type}</span>:
                              ₹{tx.amount} on {tx.payment_date}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="italic text-gray-500 mt-4">
                    Enter a Loan ID and click outside the input to load ledger
                    details.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="mb-5">
              <Button
                className="bg-blue-600 hover:bg-blue-700 transition shadow-lg"
                onClick={fetchOverview}
              >
                Fetch Overview
              </Button>
            </div>
            {overviewData ? (
              <div className="space-y-6 max-w-3xl mx-auto">
                {overviewData.loans.map((loan) => (
                  <Card
                    key={loan.loan_id}
                    className="shadow border border-gray-200 rounded-lg"
                  >
                    <CardContent className="space-y-2 pt-4 text-sm text-gray-800">
                      <p>
                        <span className="font-semibold">Loan ID:</span>{" "}
                        {loan.loan_id}
                      </p>
                      <p>
                        <span className="font-semibold">Principal:</span> ₹
                        {loan.principal}
                      </p>
                      <p>
                        <span className="font-semibold">Total Amount:</span> ₹
                        {loan.total_amount}
                      </p>
                      <p>
                        <span className="font-semibold">Interest:</span> ₹
                        {loan.total_interest}
                      </p>
                      <p>
                        <span className="font-semibold">EMI:</span> ₹
                        {loan.emi_amount}
                      </p>
                      <p>
                        <span className="font-semibold">Paid:</span> ₹
                        {loan.amount_paid}
                      </p>
                      <p>
                        <span className="font-semibold">EMIs Left:</span>{" "}
                        {loan.emis_left}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 italic">
                Click "Fetch Overview" to view loan summaries.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white text-center py-5 text-sm shadow-inner select-none">
        &copy; {new Date().getFullYear()} Bank Lending System. All rights reserved.
      </footer>
    </div>
  );
}
