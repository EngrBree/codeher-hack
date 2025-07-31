from urllib.parse import quote_plus  # Add this import
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    
    # Get raw credentials
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    RAW_MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')  # Could contain @, #, etc.
    MYSQL_HOST = os.getenv('MYSQL_HOST', '127.0.0.1')
    MYSQL_DB = os.getenv('MYSQL_DB', 'heva_db')
    
    # Encode the password for URL safety
    SAFE_MYSQL_PASSWORD = quote_plus(RAW_MYSQL_PASSWORD)
    
    # Use the encoded password
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{MYSQL_USER}:{SAFE_MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False