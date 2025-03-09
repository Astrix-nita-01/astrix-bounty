from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("all-MiniLM-L6-v2")

def match_jobs(user_skills, jobs):
    if not user_skills or not jobs:
        return {"error": "Skills or Jobs missing"}, 400

    try:
        user_embedding = model.encode(", ".join(user_skills), convert_to_tensor=True)
    except Exception as e:
        return {"error": "Failed to process skills", "details": str(e)}, 500

    job_texts = [f"{job['title']} {', '.join(job['required_skills'])}" for job in jobs]
    job_embeddings = model.encode(job_texts, convert_to_tensor=True)

    similarities = util.pytorch_cos_sim(user_embedding, job_embeddings)[0].tolist()
    matched_job_ids = [job["id"] for job, _ in sorted(zip(jobs, similarities), key=lambda x: x[1], reverse=True)]

    return {"matched_jobs": matched_job_ids}, 200
