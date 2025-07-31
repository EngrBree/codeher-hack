# Database Setup for Render Deployment

## Issue
The application is failing because it can't connect to MySQL on `localhost`. Render doesn't provide a MySQL server by default.

## Solutions

### Option 1: Use Render's PostgreSQL (Recommended)

1. **Create a PostgreSQL database on Render:**
   - Go to your Render dashboard
   - Click "New" → "PostgreSQL"
   - Name it `codeher-db`
   - Choose a plan (Free tier available)
   - Note the connection details

2. **Update requirements.txt:**
   ```
   # Replace pymysql with psycopg2-binary
   psycopg2-binary>=2.9.0
   ```

3. **Update config.py:**
   ```python
   # Use PostgreSQL instead of MySQL
   SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
   ```

### Option 2: Use External MySQL Service

#### Option 2A: PlanetScale (Free MySQL)
1. Sign up at [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get the connection string
4. Set environment variables in Render

#### Option 2B: Railway (Free MySQL)
1. Sign up at [railway.app](https://railway.app)
2. Create a MySQL database
3. Get the connection string
4. Set environment variables in Render

#### Option 2C: Clever Cloud (Free MySQL)
1. Sign up at [clever-cloud.com](https://clever-cloud.com)
2. Create a MySQL database
3. Get the connection string
4. Set environment variables in Render

### Option 3: Use SQLite (Simplest for Development)

1. **Update config.py:**
   ```python
   import os
   from dotenv import load_dotenv
   
   load_dotenv()
   
   class Config:
       SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
       
       # Use SQLite for development
       SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///codeher.db')
       SQLALCHEMY_TRACK_MODIFICATIONS = False
   ```

2. **Update requirements.txt:**
   ```
   # Remove pymysql, SQLite is built into Python
   # pymysql==1.0.2  # Remove this line
   ```

## Environment Variables for Render

### For PostgreSQL:
```
DATABASE_URL=postgresql://username:password@host:port/database
SECRET_KEY=your-secret-key-here
FLASK_ENV=production
```

### For MySQL (External):
```
DATABASE_URL=mysql+pymysql://username:password@host:port/database
SECRET_KEY=your-secret-key-here
FLASK_ENV=production
```

### For SQLite:
```
DATABASE_URL=sqlite:///codeher.db
SECRET_KEY=your-secret-key-here
FLASK_ENV=production
```

## Quick Fix: Use SQLite for Now

If you want to deploy quickly without external database setup:

1. **Update config.py:**
   ```python
   import os
   from dotenv import load_dotenv
   
   load_dotenv()
   
   class Config:
       SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
       
       # Use SQLite for development/production
       SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///codeher.db')
       SQLALCHEMY_TRACK_MODIFICATIONS = False
   ```

2. **Remove pymysql from requirements.txt:**
   ```
   wheel
   setuptools>=68.0
   pip>=25.2
   flask==2.3.2
   flask-sqlalchemy==3.0.3
   # pymysql==1.0.2  # Remove this line
   python-dotenv==1.0.0
   pyjwt==2.7.0
   Flask-Migrate==4.1.0
   alembic==1.16.4
   Mako==1.3.10
   reportlab==3.6.12
   Pillow>=10.0.0
   gunicorn>=21.0.0
   ```

3. **Set environment variables in Render:**
   ```
   DATABASE_URL=sqlite:///codeher.db
   SECRET_KEY=your-secret-key-here
   FLASK_ENV=production
   ```

## Health Check

After deployment, visit `/health` to check if the database is connected:
```
https://your-app-name.onrender.com/health
```

This will show:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T12:00:00"
}
```

## Recommended Approach

1. **For Development/Testing:** Use SQLite (Option 3)
2. **For Production:** Use Render PostgreSQL (Option 1)
3. **For Advanced Users:** Use external MySQL service (Option 2) 