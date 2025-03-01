// src/App.tsx

import React, { useState } from 'react';
import { HiveWalletProvider, useHiveWallet } from '@/wallet/HIveKeychainAdapter';
import { Button } from '@/components/ui/button';

interface TransactionLog {
  status: "success" | "failed";
  details: string | Record<string, any>;
  timestamp: number;
}


const ConnectButton: React.FC = () => {
  const { isConnected, account, connectWallet, disconnectWallet } = useHiveWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      {isConnected ? (
        <div>
          <Button variant="default" onClick={() => setDropdownOpen(!dropdownOpen)}>
            {account} ▼
          </Button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
              <button
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                onClick={disconnectWallet}
              >
                Disconnect
              </button>
              <TransactionExample />
            </div>
          )}
        </div>
      ) : (
        <Button variant="default" onClick={connectWallet}>Connect Hive Wallet</Button>
      )}
    </div>
  );
};

const TransactionExample: React.FC = () => {
  const { signTransaction, isConnected, account, transactionLog } = useHiveWallet();

  const handleCustomJson = async () => {
    if (!isConnected || !account) return;

    try {
      const operation: [string, any] = [
        "custom_json",
        {
          required_auths: [],
          required_posting_auths: [account],
          id: "test_operation",
          json: JSON.stringify({
            message: "This is a test transaction",
            timestamp: Date.now(),
          }),
        },
      ];

      const result = await signTransaction(operation, "Posting");
      console.log("Transaction successful:", result);
    } catch (err) {
      console.error("Transaction failed:", (err as Error).message);
    }
  };

  return (
    <div>
      <button onClick={handleCustomJson} disabled={!isConnected}>
        Send Test Transaction
      </button>
      {transactionLog && (
        <div style={{ marginTop: "10px" }}>
          <h3>Transaction Log:</h3>
          <p>
            Status:{" "}
            <span style={{ color: transactionLog.status === "success" ? "green" : "red" }}>
              {transactionLog.status}
            </span>
          </p>
          <p>
            Details:{" "}
            {typeof transactionLog.details === "string"
              ? transactionLog.details
              : JSON.stringify(transactionLog.details)}
          </p>
          <p>Timestamp: {new Date(transactionLog.timestamp).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};


const App: React.FC = () => {
  return (
    <HiveWalletProvider>
      <div className="App p-4">
        
        <ConnectButton />
      </div>
    </HiveWalletProvider>
  );
};

export default App;