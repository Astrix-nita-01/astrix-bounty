# Astrix-Bounty

Astrix-Bounty is a decentralized platform built with Next.js that enables users to sell services (e.g., creative writing, NFT creation, music, digital art) and manage transactions using the Hive blockchain. The platform integrates with the Hive Keychain extension to facilitate secure wallet connections and cryptocurrency payments (HIVE). This project is designed for a hackathon, showcasing a user-friendly interface for service submission with real-time transaction capabilities.

## Features
- **Service Submission**: Users can submit services with a title, description, category, and price on the `/sell` page.
- **Hive Wallet Integration**: Connects to Hive Keychain for wallet authentication and transaction signing.
- **Transaction Payment**: Allows users to pay 1.000 HIVE to the `platform` address to submit a service, with Hive Keychain approval.
- **Navigation**: Includes links to Browse, Hire (/sell), Review (/governance), and Profile pages, styled with a dark theme and purple connect button.

## Prerequisites
- **Node.js**: Version 14.x or higher.
- **npm**: Version 6.x or higher (comes with Node.js).
- **Hive Keychain Extension**: Installed in your browser (e.g., Chrome or Firefox) and logged into a Hive account with sufficient HIVE (at least 1 HIVE for testing transactions).
- **Code Editor**: e.g., VS Code.

## Installation

### Step 1: Clone the Repository
```
git clone <your-repo-url>
cd astrix-bounty
```

### Step 2: Install Dependencies
Run the following command to install the required Node.js packages:
```
npm install
```

### Step 3: Set Up Environment
No environment variables are required for this project. However, ensure your Hive Keychain is configured with a test account that has HIVE for transaction testing.

### Step 4: Run the Development Server
Start the Next.js development server with:

```
npm run dev
```

Open your browser and navigate to http://localhost:3000. The app should be running, and you’ll see the navigation bar and the default page.

### Step 5: Connect Hive Wallet

- Install the Hive Keychain extension if not already installed.
- Log into Hive Keychain with a Hive account that has at least 1 HIVE.
- Click the "Connect Hive Wallet" button in the navigation bar to connect your wallet. The button will change to show your username (e.g., "Connected as: <username>").

### Step 6: Test the Sell Page
- Navigate to http://localhost:3000/sell.
- Fill out the form with a title, description, category, and price.
- Click "Pay and Submit" to open the payment overlay.
- Click "Pay 1.000 HIVE" to initiate a transaction. Approve the transaction in the Hive Keychain popup.
- If successful, you’ll see an alert confirming the payment, and the overlay will close.

### Step 7: Explore Navigation
- Click "Hire" to navigate to the /sell page.
- Click "Review" to navigate to the /governance page.
- Use "Browse" and "Profile" to explore other pages (note: these may be placeholders unless implemented).

### Technologies Used
- Next.js: React framework for server-side rendering and static site generation.
- TypeScript: For type safety in the codebase.
- Tailwind CSS: For responsive and customizable styling.
- Hive SDK (@hiveio/dhive): For interacting with the Hive blockchain.
- Hive Keychain: Browser extension for wallet management and transaction signing.
- Tailwind CSS: For responsive and customizable styling.
- Hive SDK (@hiveio/dhive): For interacting with the Hive blockchain.
- Hive Keychain: Browser extension for wallet management and transaction signing.

### Contributing
This is a hackathon project, but contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request.
