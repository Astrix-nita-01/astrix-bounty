from flask import Flask
from app.routes import job_routes
from app.config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    app.register_blueprint(job_routes)

    return app
