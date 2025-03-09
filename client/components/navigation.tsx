"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { WalletConnectButton } from "@/wallet/HIveKeychainAdapter";
import { useHiveWallet } from "@/wallet/HIveKeychainAdapter";

export function Navigation() {
  const [isClient, setIsClient] = useState(false);
  const { isConnected, account, disconnectWallet } = useHiveWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isClient) {
    return null; // Prevents hydration mismatch
  }

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Navigation Links */}
        <div className="flex items-center space-x-6 text-gray-800 text-lg font-semibold">
          <Link href="/" className="hover:text-gray-500 transition duration-300">
            Astrix-Bounty
          </Link>
          <Link href="/browse" className="hover:text-gray-500 transition duration-300">
            Browse
          </Link>
          <Link href="/hire" className="hover:text-gray-500 transition duration-300">
            Hire
          </Link>
          <Link href="/activities" className="hover:text-gray-500 transition duration-300">
            Activity
          </Link>
          <Link href="/mybounties" className="hover:text-gray-500 transition duration-300">
            My Bounties
          </Link>
          <Link href="/profile" className="hover:text-gray-500 transition duration-300">
            Profile
          </Link>
        </div>

        {/* Search Bar and Wallet Button */}
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search prompts..."
            className="p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-300"
          />

          {/* Wallet Button & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {isConnected ? (
              <div>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 font-medium rounded-full shadow-md hover:bg-gray-200 transition flex items-center"
                >
                  {account} ▼
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                    <button
                      onClick={disconnectWallet}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 transition"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <WalletConnectButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
