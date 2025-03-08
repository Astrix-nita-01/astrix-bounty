"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { Client, PublicKey } from '@hiveio/dhive';

declare global {
  interface Window {
    hive_keychain?: any;
  }
}

interface Keys {
  posting: string | PublicKey | null;
  active: string | PublicKey | null;
  owner: string | PublicKey | null;
  memo: string | PublicKey | null;
}

interface HiveWalletContextType {
  isConnected: boolean;
  setIsConnected: Dispatch<SetStateAction<boolean>>;
  account: string | null;
  error: string | null;
  keys: Keys;
  transactionLog: any;
  connectWallet: () => Promise<void>;
  signTransaction: (operation: any, keyType?: string) => Promise<any>;
  disconnectWallet: () => void;
  isHiveKeychainInstalled: () => boolean;
  isKeychainAvailable: boolean;
}

const defaultState: HiveWalletContextType = {
  isConnected: false,
  setIsConnected: () => {},
  account: null,
  error: null,
  keys: {
    posting: null,
    active: null,
    owner: null,
    memo: null,
  },
  transactionLog: null,
  connectWallet: async () => {},
  signTransaction: async () => {},
  disconnectWallet: () => {},
  isHiveKeychainInstalled: () => false,
  isKeychainAvailable: false,
};

interface HiveWalletProviderProps {
  children: ReactNode;
}

const hiveClient = new Client(['https://api.hive.blog', 'https://api.deathwing.me', 'https://api.vsc.eco']);

const HiveWalletContext = createContext<HiveWalletContextType>(defaultState);

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
  const [keys, setKeys] = useState<Keys>({
    posting: null,
    active: null,
    owner: null,
    memo: null,
  });
  const [transactionLog, setTransactionLog] = useState<any>(null);

  console.log("HiveWalletContext:", { isConnected, account, error, isKeychainAvailable });

  const checkHiveKeychain = useCallback((): boolean => {
    return typeof window !== 'undefined' && !!window.hive_keychain;
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

  const connectWallet = useCallback(async () => {
    console.log("Starting connectWallet");
    try {
      if (!checkHiveKeychain()) {
        throw new Error('Hive Keychain extension is not installed or not detected.');
      }
      console.log("Hive Keychain detected, requesting sign buffer");
      const response = await new Promise<any>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Connection timed out after 5 seconds' });
        }, 5000);

        window.hive_keychain!.requestSignBuffer(
          null,
          'login',
          'Posting',
          (resp: any) => {
            clearTimeout(timeout);
            console.log("Response from Hive Keychain:", resp);
            resolve(resp || { success: false, error: 'No response received' });
          },
          null,
          'login'
        );
      });
      console.log("Response received:", response);

      if (!response.success || !response.data?.username) {
        throw new Error(response.error || 'Failed to connect to Hive Keychain');
      }
      const username = response.data.username;
      console.log("Connected as:", username);
      setAccount(username);
      setIsConnected(true);
      setError(null);

      const accountData = await hiveClient.database.getAccounts([username]);
      if (!accountData || accountData.length === 0) {
        throw new Error('Failed to fetch account data');
      }

      const publicKeys: Keys = {
        posting: accountData[0].posting.key_auths[0][0].toString(),
        active: accountData[0].active.key_auths[0][0].toString(),
        owner: accountData[0].owner.key_auths[0][0].toString(),
        memo: accountData[0].memo_key.toString(),
      };
      setKeys(publicKeys);
      console.log("Public keys fetched:", publicKeys);
    } catch (err) {
      console.error("Connection error:", (err as Error).message);
      setError((err as Error).message);
      setIsConnected(false);
      setAccount(null);
      setKeys({ posting: null, active: null, owner: null, memo: null });
    }
  }, [checkHiveKeychain]);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setAccount(null);
    setError(null);
    setKeys({ posting: null, active: null, owner: null, memo: null });
    setTransactionLog(null);
  }, []);

  const signTransaction = useCallback(async (operation: any, keyType: string = 'Active') => {
    if (!isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    if (!checkHiveKeychain()) {
      throw new Error('Hive Keychain not detected');
    }

    return new Promise((resolve, reject) => {
      if (operation[0] === 'transfer') {
        const { from, to, amount, memo } = operation[1];
        console.log("Initiating transfer:", { from, to, amount, memo });
        window.hive_keychain!.requestTransfer(
          from,
          to,
          amount,
          memo,
          'HIVE',
          (response: any) => {
            console.log("Transfer response:", response);
            if (response.success) {
              setTransactionLog({
                status: 'success',
                details: response,
                timestamp: Date.now(),
              });
              resolve(response);
            } else {
              setTransactionLog({
                status: 'failed',
                details: response.error || 'Unknown error',
                timestamp: Date.now(),
              });
              reject(new Error(response.error || 'Transfer failed'));
            }
          },
          true
        );
      } else if (operation[0] === 'custom_json') {
        window.hive_keychain!.requestBroadcast(
          account,
          [operation],
          keyType,
          (response: any) => {
            if (response.success) {
              setTransactionLog({
                status: 'success',
                details: response,
                timestamp: Date.now(),
              });
              resolve(response);
            } else {
              setTransactionLog({
                status: 'failed',
                details: response.error || 'Unknown error',
                timestamp: Date.now(),
              });
              reject(new Error(response.error || 'Broadcast failed'));
            }
          }
        );
      } else {
        reject(new Error('Unsupported operation type'));
      }
    });
  }, [isConnected, account, checkHiveKeychain]);

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
        signTransaction,
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
            <button
              onClick={disconnectWallet}
              className="ml-2 px-4 py-2 bg-purple-800 text-black rounded-md hover:bg-purple-600 "
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={connectWallet}
            className="px-4 py-2 bg-purple-600 text-black rounded-full hover:bg-purple-700"
          >
            Connect Hive Wallet
          </button>
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