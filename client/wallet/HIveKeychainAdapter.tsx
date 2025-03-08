"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { Client } from '@hiveio/dhive';

declare global {
  interface Window {
    hive_keychain?: any;
  }
}

interface HiveWalletContextType {
  isConnected: boolean;
  setIsConnected: Dispatch<SetStateAction<boolean>>;
  account: string | null;
  error: string | null;
  keys: {
    posting: string | null;
    active: string | null;
    owner: string | null;
    memo: string | null;
  };
  transactionLog: any;
  connectWallet: () => Promise<void>;
  signTransaction: (operation: any, keyType?: string) => Promise<any>;
  disconnectWallet: () => void;
  isHiveKeychainInstalled: () => boolean;
  isKeychainAvailable: boolean;
}

const defaultState = {
  isConnected: false,
  setIsConnected: (isConnected: boolean) => {},
  account: null,
  error: null,
  keys: {
    posting: null,
    active: null,
    owner: null,
    memo: null,
  },
  transactionLog: '',
  connectWallet: () => {},
  signTransaction: (operation: any, keyType?: string) => {},
  disconnectWallet: () => {},
  isHiveKeychainInstalled: () => {},
  isKeychainAvailable: false,
} as HiveWalletContextType;

interface HiveWalletProviderProps {
  children: ReactNode;
}

const hiveClient = new Client(['https://api.hive.blog', 'https://api.deathwing.me', 'https://api.vsc.eco']);

const HiveWalletContext = createContext<HiveWalletContextType | undefined>(defaultState);

export const useHiveWallet = (): HiveWalletContextType => {
  const context = useContext(HiveWalletContext);
  if (!context) {
    throw new Error('useHiveWallet must be used within HiveWalletProvider');
  }
  return context;
};

export const HiveWalletProvider: React.FC<HiveWalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isKeychainAvailable, setIsKeychainAvailable] = useState<boolean>(false);
  const [keys, setKeys] = useState({
    posting: null,
    active: null,
    owner: null,
    memo: null,
  });
  const [transactionLog, setTransactionLog] = useState<any>(null);

  const checkHiveKeychain = useCallback((): boolean => {
    return typeof window !== 'undefined' && window.hive_keychain;
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const detectKeychain = () => {
      if (checkHiveKeychain()) {
        setIsKeychainAvailable(true);
        if (intervalId) clearInterval(intervalId);
      } else {
        setIsKeychainAvailable(false);
      }
    };

    detectKeychain();
    intervalId = setInterval(detectKeychain, 1000);
    
    const timeoutId = setTimeout(() => {
      if (intervalId) clearInterval(intervalId);
      console.log('Polling stopped after 10 seconds');
    }, 10000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [checkHiveKeychain]);

  useEffect(() => {
    console.log("Connection state changed:", isConnected);
  }, [isConnected]);

  const connectWallet = useCallback(async () => {
    try {
      if (!checkHiveKeychain()) {
        throw new Error('Hive Keychain extension is not installed or not detected.');
      }

      console.log('Attempting to connect with Hive Keychain');
      const response = await new Promise<any>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Connection timed out after 5 seconds' });
        }, 5000);

        try {
          window.hive_keychain!.requestSignBuffer(
            null,
            'login',
            'Posting',
            (resp: any) => {
              clearTimeout(timeout);
              resolve(resp || { success: false, error: 'No response received' });
            },
            null,
            'login'
          );
        } catch (err) {
          clearTimeout(timeout);
          resolve({ success: false, error: `Connection error: ${(err as Error).message}` });
        }
      });

      console.log("response: ", response);

      if (!response.success || !response.data?.username) {
        throw new Error(response.error || 'Failed to connect to Hive Keychain');
      }

      const username = response.data.username;
      console.log("username: ", username);
      setAccount(username);
      setIsConnected(true);
      setError(null);
      console.log("Wallet connected: ", isConnected);
      

      const accountData = await hiveClient.database.getAccounts([username]);
      if (!accountData || accountData.length === 0) {
        throw new Error('Failed to fetch account data');
      }
    } catch (err) {
      setError((err as Error).message);
      setIsConnected(false);
      setAccount(null);
      setKeys({ posting: null, active: null, owner: null, memo: null });
    }
  }, [checkHiveKeychain]);

  const disconnectWallet = useCallback(() => {
    console.log("state: :", isConnected);
    setIsConnected(false);
    setAccount(null);
    setError(null);
    setKeys({ posting: null, active: null, owner: null, memo: null });
    setTransactionLog(null);
  }, []);

  return (
    <HiveWalletContext.Provider
      value={{
        isConnected,
        setIsConnected,
        account,
        error,
        keys,
        transactionLog,
        connectWallet,
        signTransaction: async () => {},
        disconnectWallet,
        isHiveKeychainInstalled: checkHiveKeychain,
        isKeychainAvailable,
      }}
    >
      {children}
    </HiveWalletContext.Provider>
  );
};

export const WalletConnectButton: React.FC = () => {
  const { isConnected, account, connectWallet, disconnectWallet, error, isKeychainAvailable } = useHiveWallet();
  return (
    <div>
      {isKeychainAvailable ? (
        isConnected ? (
          <>
            <p>Connected as: {account}</p>
            <button onClick={disconnectWallet}>Disconnect</button>
          </>
        ) : (
          <button onClick={connectWallet}>Connect Hive Wallet</button>
        )
      ) : (
        <div>
          <p>Hive Keychain not detected</p>
          <a href="https://hive-keychain.com/" target="_blank" rel="noopener noreferrer">
            Install Hive Keychain
          </a>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};
export const WalletKeysDisplay = () => {
  const { isConnected, keys } = useHiveWallet();

  if (!isConnected) return null;

  return (
    <div>
      <p>Public Keys:</p>
      <ul>
        <li>Posting: {keys.posting || 'Not Available'}</li>
        <li>Active: {keys.active || 'Not Available'}</li>
        <li>Owner: {keys.owner || 'Not Available'}</li>
        <li>Memo: {keys.memo || 'Not Available'}</li>
      </ul>
    </div>
  );
};