"use client";

import React, { useState, useEffect } from "react";
import { useHiveWallet } from "@/wallet/HIveKeychainAdapter";

export default function SellPage() {
  const { isConnected, account, signTransaction } = useHiveWallet();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);

  console.log("SellPage - isConnected:", isConnected);
  console.log("SellPage - account:", account);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !account) {
      alert("Please connect your wallet first");
      return;
    }
    setShowPaymentOverlay(true);
  };

  const handlePay = async () => {
    if (!isConnected || !account) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const operation = [
        "transfer",
        {
          from: account,
          to: "cyph37",
          amount: "1.000",
          memo: "Payment for service submission",
        },
      ];

      console.log("Initiating real transaction:", operation);
      const result = await signTransaction(operation, "Active");
      console.log("Transaction successful:", result);
      setShowPaymentOverlay(false);
      alert("Payment of 1.000 HIVE to cyph37 completed successfully!");
    } catch (err: any) {
      console.error("Transaction failed:", err.message);
      alert("Transaction failed: " + err.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sell a Service</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          >
            <option value="">Select a category</option>
            <option value="creative-writing">Creative Writing</option>
            <option value="nft">NFT</option>
            <option value="music">Music</option>
            <option value="digital-art">Digital Art</option>
          </select>
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium">
            Price (HIVE)
          </label>
          <input
            id="price"
            type="number"
            step="0.001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <button
          type="submit"
          disabled={!isConnected}
          className={`px-4 py-2 rounded-md text-white ${
            isConnected ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Pay and Submit
        </button>
      </form>

      {/* Payment Overlay */}
      {showPaymentOverlay && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "5px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>
              Complete Your Payment
            </h2>
            <p>Pay 1.000 HIVE to submit your service.</p>
            <button
              onClick={handlePay}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#4CAF50",
                color: "white",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#45a049")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4CAF50")}
            >
              Pay 1.000 HIVE
            </button>
            <button
              onClick={() => setShowPaymentOverlay(false)}
              style={{
                marginTop: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#ddd",
                color: "black",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#ccc")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ddd")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}