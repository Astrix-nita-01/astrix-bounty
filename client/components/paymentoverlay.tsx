import { useState } from "react";
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
}

export default function PaymentOverlay({ amount, onClose }: PaymentOverlayProps) {
  const { signTransaction, isConnected, account } = useHiveWallet();

  const [platformAccount] = useState('cyph37'); // Default platform wallet
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const isValidAmount = (value:string) => /^\d+\.\d{3}$/.test(value);

  const handlePayment = async () => {
    // if (!isConnected) {
    //   setErrorMessage('Please connect your wallet');
    //   return;
    // }

    if (!isValidAmount(amount)) {
      setErrorMessage('Amount must be in X.XXX format (e.g., 1.000 HIVE)');
      return;
    }

    try {
      const operation = [
        'transfer',
        {
          from: account, // Client wallet
          to: platformAccount, // Platform wallet (@cyph37)
          amount: `${amount} HIVE`,
          memo: `Payment for freelancing task - ${Date.now()}`,
        },
      ];

      console.log('Payment operation:', operation);
      const result = await signTransaction(operation, 'Active');
      console.log('Payment successful:', result);
      setTransactionId(result.result.id); // Transaction ID from Hive Keychain response
      setErrorMessage('');
      // Store transaction in local state (for demo; use backend in production)
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      transactions.push({
        id: result.result.id,
        from: account,
        amount: `${amount} HIVE`,
        userConfirmed: false,
        freelancerConfirmed: false,
        timestamp: new Date().toLocaleString(),
      });
      localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (err:any) {
      console.error('Payment failed:', err.message);
      setErrorMessage(err.message || 'Payment failed');
    }
  };
  return (
    
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">Complete Your Payment</h2>
        <p className="text-sm text-gray-600 mb-2">Amount: {amount} HIVE</p>

        <button
          onClick={handlePayment}
          className="w-full bg-blue-500 text-white py-2 rounded mt-4"
          // disabled={!isConnected}

        >
          Pay {amount} HIVE
        </button>
        

        {transactionId && (
          <p className="mt-2 text-sm text-green-600">Transaction ID: {transactionId}</p>
        )}

        {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}

        <button onClick={onClose} className="mt-4 w-full text-gray-700 text-sm">
          Close
        </button>
      </div>
    </div>
  );
}
