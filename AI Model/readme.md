# **🔍 JOB MATCHER API**  
**An AI-powered job matching system using NLP & Deep Learning**  


---



## **About the Project**  
This project is an **AI-driven job recommendation system** built using **Flask** and **Sentence Transformers**. It efficiently matches job seekers' skills with job descriptions using **semantic similarity** based on **natural language processing (NLP)**.  

###  **Tech Stack:**  
- **Backend:** Flask (Python)  
- **AI Model:** Sentence Transformers (**`all-MiniLM-L6-v2`**)  
- **Machine Learning:** PyTorch  
- **Environment Variables:** dotenv  
- **Deployment Ready:** Scalable architecture  


---

## **How It Works?**  
1️⃣ **User provides their skill set**  
2️⃣ **Job descriptions are processed** to extract relevant skills  
3️⃣ **Sentence Transformers compute similarity scores**  
4️⃣ **Jobs are ranked based on relevance**  
5️⃣ **Best-matching jobs are returned in sorted order**  

---

## **📦 Project Directory Structure**
```
job_matcher/
│── app/
│   ├── __init__.py        # Flask App Factory
│   ├── routes.py          # API Endpoints
│   ├── services.py        # Job Matching Logic (AI Processing)
│   ├── config.py          # App Configuration
│── requirements.txt       # Dependencies
│── run.py                 # App Entry Point
│── README.md              # Documentation
```

---

## **Setup & Installation**
### **Prerequisites**
- Python 3.8+
- pip (Python Package Manager)

### **Installation Steps**
1️⃣ **Clone the Repository**  
```sh
git clone https://github.com/your-repo/job-matcher.git
cd job-matcher
```

2️⃣ **Create a Virtual Environment**  
```sh
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

3️⃣ **Install Dependencies**  
```shk
pip install -r requirements.txt
```

4️⃣ **Run the Flask App**  
```sh
python run.py
```
Your API is now running at **`http://127.0.0.1:5000`**  

---

## **API Endpoints**
### **Job Matching Endpoint**
**URL:** `/match_jobs`  
**Method:** `POST`  
**Request Format:**
```json
{
  "skills": ["Python", "Machine Learning", "NLP"],
  "jobs": [
    { "id": 1, "title": "Data Scientist", "required_skills": ["Python", "AI", "Deep Learning"] },
    { "id": 2, "title": "Software Engineer", "required_skills": ["JavaScript", "React", "Node.js"] }
  ]
}
```
**Response Format:**
```json
{
  "matched_jobs": [1, 2]
}
```

---

## **Technologies & AI Model Used**
### **NLP Model: Sentence Transformer (`all-MiniLM-L6-v2`)**
- **Trained by:** [Hugging Face](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)  
- **Description:** A **lightweight** and **efficient** transformer-based model for computing **semantic similarity** between sentences.  
- **Why this model?**
  
  ✅ High accuracy with low computational cost  
  ✅ Suitable for **real-time** applications  
  ✅ Supports **multi-sentence encoding** for large-scale comparisons  


💙 Thanks to **Flask**, **Hugging Face**, and the **hackathon team** for making this project possible.