import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import {
  HiveWalletProvider,
  WalletConnectButton,
  WalletKeysDisplay,
  useHiveWallet,
} from '@/wallet/HIveKeychainAdapter';

interface PaymentOverlayProps {
  amount: string;
  onClose: () => void;
  handleSubmit: () => void;
}

export default function PaymentOverlay({ amount, onClose, handleSubmit }: PaymentOverlayProps) {
  const { signTransaction, isConnected, account, connectWallet } = useHiveWallet();

  const [platformAccount] = useState('cyph37');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValidAmount = (value:string) => /^\d+\.\d{3}$/.test(value);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      await connectWallet();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!isConnected || !account) {
      await handleConnect();
      return;
    }

    // if (!isValidAmount(amount)) {
    //   setErrorMessage('Amount must be in X.XXX format (e.g., 1.000 HIVE)');
    //   return;
    // }

    try {
      console.log("submitting");
      setIsLoading(true);
      handleSubmit();
      // ...existing payment logic...
    } catch (err:any) {
      console.error('Payment failed:', err.message);
      setErrorMessage(err.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">Complete Your Payment</h2>
        <p className="text-sm text-gray-600 mb-2">Amount: {amount} HIVE</p>

        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 rounded mt-4"
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 rounded mt-4"
          >
            {isLoading ? 'Processing...' : `Pay ${amount} HIVE`}
          </button>
        )}

        {account && (
          <p className="mt-2 text-sm text-green-600">Connected as: {account}</p>
        )}

        {transactionId && (
          <p className="mt-2 text-sm text-green-600">
            Transaction ID: {transactionId}
          </p>
        )}

        {errorMessage && (
          <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
        )}

        <button 
          onClick={onClose}
          className="mt-4 w-full text-gray-700 text-sm"
          disabled={isLoading}
        >
          Close
        </button>
      </div>
    </div>
  );
}
