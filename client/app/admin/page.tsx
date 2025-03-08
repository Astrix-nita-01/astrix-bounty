"use client"

import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import {
  useHiveWallet,
} from '../../wallet/HIveKeychainAdapter';

interface Transaction {
  id: string;
  from: string;
  amount: string;
  userConfirmed: boolean;
  freelancerConfirmed: boolean;
  timestamp: string;
}

const Admin: React.FC = () => {
  const { signTransaction, isConnected, account, connectWallet } = useHiveWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [freelancerAddresses, setFreelancerAddresses] = useState<{ [key: string]: string }>({});
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedTransactions = JSON.parse(localStorage.getItem('transactions') || '[]') as Transaction[];
    setTransactions(storedTransactions);
  }, []);

  useEffect(() => {
    console.log("Admin Page - Connection State:", isConnected);
    console.log("Admin Page - Account:", account);
  }, [isConnected, account]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      await connectWallet();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(`Failed to connect wallet: ${err.message}`);
      } else {
        setErrorMessage('Failed to connect wallet: An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
    
  };

  const handleConfirmation = (id: string, type: keyof Transaction) => {
    const updatedTransactions = transactions.map((tx) =>
      tx.id === id ? { ...tx, [type]: !tx[type] } : tx
    );
    setTransactions(updatedTransactions);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
  };

  const handleSendToFreelancer = async (txId: string) => {
    if (!isConnected) {
      await handleConnect();
      return;
    }

    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    const freelancerAddress = freelancerAddresses[txId];

    if (!freelancerAddress || !/^[a-z][a-z0-9\-\.]{2,15}$/.test(freelancerAddress)) {
      setErrorMessage('Invalid freelancer address');
      return;
    }

    try {
      const operation = [
        'transfer',
        {
          from: 'cyph37',
          to: freelancerAddress,
          amount: tx.amount,
          memo: `Payout for task - Transaction ${txId}`,
        },
      ];

      console.log('Payout operation:', operation);
      const result = await signTransaction(operation, 'Active');
      console.log('Payout successful:', result);
      setErrorMessage('');

      const updatedTransactions = transactions.filter((t) => t.id !== txId);
      setTransactions(updatedTransactions);
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Payout failed:', err.message); // Access `message` safely
        setErrorMessage(err.message || 'Payout failed');
      } else {
        console.error('Payout failed: An unknown error occurred');
        setErrorMessage('Payout failed: An unknown error occurred');
      }
    }
  };

  const handleTestTransaction = () => {
    const mockTransaction: Transaction = {
      id: `test-${Date.now()}`,
      from: 'test-client',
      amount: '1.000 HIVE',
      userConfirmed: false,
      freelancerConfirmed: false,
      timestamp: new Date().toLocaleString(),
    };

    const updatedTransactions = [...transactions, mockTransaction];
    setTransactions(updatedTransactions);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    console.log('Test transaction added:', mockTransaction);
  };

  return (
      <div>
        {/* <Navigation /> */}
        <main className="flex-1 container py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Admin-Transaction Management</h1>
            
            {!isConnected ? (
              <div className="mb-4">
                <Button 
                  onClick={handleConnect}
                  disabled={isLoading}
                >
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              </div>
            ) : (
              <div className="mb-4">
                <Button 
                  onClick={handleTestTransaction} 
                  style={{ marginBottom: '15px' }}
                >
                  Add Test Transaction
                </Button>
              </div>
            )}

            {transactions.length === 0 ? (
              <p>No transactions yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {transactions.map((tx) => (
                  <li key={tx.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                    <p><strong>Transaction ID:</strong> {tx.id}</p>
                    <p><strong>From:</strong> {tx.from}</p>
                    <p><strong>Amount:</strong> {tx.amount}</p>
                    <p><strong>Timestamp:</strong> {tx.timestamp}</p>
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ marginRight: '20px' }}>
                        <input
                          type="checkbox"
                          checked={tx.userConfirmed}
                          onChange={() => handleConfirmation(tx.id, 'userConfirmed')}
                        />
                        User Confirmation
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={tx.freelancerConfirmed}
                          onChange={() => handleConfirmation(tx.id, 'freelancerConfirmed')}
                        />
                        Freelancer Confirmation
                      </label>
                    </div>
                    {tx.userConfirmed && tx.freelancerConfirmed && (
                      <div style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Freelancer Address:</label>
                        <input
                          type="text"
                          value={freelancerAddresses[tx.id] || ''}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          onChange={(e) =>
                            setFreelancerAddresses((prev) => ({ ...prev, [tx.id]: e.target.value.toLowerCase() }))
                          }
                          placeholder="Freelancer's Hive username"
                          style={{ width: '70%', padding: '8px', marginRight: '10px' }}
                        />
                        <Button className='bg-purple-500 rounded-full' onClick={() => handleSendToFreelancer(tx.id)}>
                          Send to Freelancer ({tx.amount})
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {errorMessage && <div style={{ color: 'red', marginTop: '15px' }}>{errorMessage}</div>}
          </div>
        </main>
      </div>
  );
};

export default Admin;