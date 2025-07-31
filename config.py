import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # Use SQLite as default, but allow override with DATABASE_URL
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///codeher.db')
    
    # If DATABASE_URL is provided, use it; otherwise use SQLite
    if DATABASE_URL.startswith('sqlite'):
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        # For MySQL/PostgreSQL, use the provided DATABASE_URL
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False