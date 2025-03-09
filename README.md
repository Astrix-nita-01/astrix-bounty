# **ASTRIX BOUNTY  ✦  INTELLIMATCH | BLOCKCHIAN MEETS AI**


Astrix-Bounty is a decentralized service marketplace built with **Next.js** and integrated with the **Hive blockchain** for secure payments. Additionally, our project includes an **AI-powered job matching system** using **Flask** and **Sentence Transformers**, enabling intelligent job recommendations based on **semantic similarity**.

This project is developed for a **hackathon**, showcasing a **user-friendly interface** with **real-time transactions and AI-powered job matching**.

## **Features**
### **Astrix-Bounty**
- **Service Submission**: Users can list services (e.g., creative writing, NFT creation, music, digital art) on the `/sell` page.
- **Hive Wallet Integration**: Uses Hive Keychain for wallet authentication and transaction signing.
- **Transaction Payment**: Payments are processed in **HIVE cryptocurrency**.
- **Navigation**: Browse, Hire (/sell), Review (/governance), and Profile pages with a **dark theme UI**.

### **Job Matcher API**
- **AI-Powered Job Matching**: Uses **NLP & deep learning** to match users' skills with job descriptions.
- **Fast & Efficient**: Implements **Sentence Transformers (`all-MiniLM-L6-v2`)** for **semantic similarity** calculations.
- **API-Based**: Returns **relevant job matches** via a REST API.
- **Real-time Processing**: Scalable and lightweight for instant job recommendations.

---

## **Prerequisites**
### **Astrix-Bounty**
- **Node.js**: 14.x or higher
- **npm**: 6.x or higher
- **Hive Keychain Extension**: Installed & configured with a Hive account.
- **Code Editor**: e.g., VS Code

### **Job Matcher API**
- **Python 3.8+**
- **pip** (Python Package Manager)

---

## **Installation**
### **Astrix-Bounty (Next.js)**
1. Clone the repository:
   ```sh
   git clone https://github.com/Astrix-nita-01/astrix-bounty.git
   cd astrix-bounty
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) to see the app.

### **Job Matcher API (Flask)**
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/job-matcher.git
   cd job-matcher
   ```
2. Create a virtual environment:
   ```sh
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Run the Flask API:
   ```sh
   python run.py
   ```
   The API will be available at **`http://127.0.0.1:5000`**.

---

## **API Endpoints (Job Matcher API)**
### **Job Matching Endpoint**
- **URL:** `/match_jobs`
- **Method:** `POST`
- **Request Format:**
  ```json
  {
  "skills": ["Python", "Django", "AI"],
  "jobs": [
    {"id": 1, "title": "Django Developer", "required_skills": ["Python", "Django"]},
    {"id": 2, "title": "React Developer", "required_skills": ["JavaScript", "React"]},
    {"id": 3, "title": "AI Engineer", "required_skills": ["Python", "AI", "Machine Learning"]}
  ]
  }
  ```
- **Response Format:**
  ```json
  {
    "matched_jobs": [
        3,
        1,
        2
    ]
  }
  ```

---

## **Technologies Used**
### **Astrix-Bounty**
- **Next.js**: React framework for SSR and static site generation.
- **TypeScript**: Ensures type safety.
- **Tailwind CSS**: Responsive styling.
- **Hive SDK (`@hiveio/dhive`)**: Blockchain interactions.
- **Hive Keychain**: Secure wallet management.

### **Job Matcher API**
- **Flask**: Lightweight Python web framework.
- **Sentence Transformers (`all-MiniLM-L6-v2`)**: AI model for semantic similarity.
- **PyTorch**: Deep learning framework.
- **dotenv**: Manages environment variables.

---


💙 Thanks to **Flask**, **Next.js**, **Hive**, **Hugging Face**, and the **hackathon team** for making this project possible!

