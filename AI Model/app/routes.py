from flask import Blueprint, request, jsonify
from app.services import match_jobs

job_routes = Blueprint("job_routes", __name__)

@job_routes.route("/match_jobs", methods=["POST"])
def match():
    data = request.get_json()
    user_skills = data.get("skills", [])
    jobs = data.get("jobs", [])

    response, status = match_jobs(user_skills, jobs)
    return jsonify(response), status
