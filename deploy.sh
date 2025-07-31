#!/bin/bash

# HEVA Platform Deployment Script
# This script automates the deployment process for different hosting platforms

set -e

echo "🚀 HEVA Platform Deployment Script"
echo "=================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Python version
check_python() {
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
        if [[ $(echo "$PYTHON_VERSION >= 3.8" | bc -l) -eq 1 ]]; then
            echo "✅ Python $PYTHON_VERSION found"
            return 0
        else
            echo "❌ Python 3.8+ required, found $PYTHON_VERSION"
            return 1
        fi
    else
        echo "❌ Python3 not found"
        return 1
    fi
}

# Function to check MySQL
check_mysql() {
    if command_exists mysql; then
        echo "✅ MySQL found"
        return 0
    else
        echo "❌ MySQL not found"
        return 1
    fi
}

# Function to setup virtual environment
setup_venv() {
    echo "📦 Setting up virtual environment..."
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    echo "✅ Virtual environment setup complete"
}

# Function to setup environment variables
setup_env() {
    echo "🔧 Setting up environment variables..."
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "📝 Please edit .env file with your database credentials"
        echo "   - MYSQL_USER=your_mysql_user"
        echo "   - MYSQL_PASSWORD=your_mysql_password"
        echo "   - MYSQL_HOST=your_mysql_host"
        echo "   - MYSQL_DB=heva_db"
        echo "   - SECRET_KEY=your_secret_key"
    else
        echo "✅ .env file already exists"
    fi
}

# Function to setup database
setup_database() {
    echo "🗄️  Setting up database..."
    
    # Check if MySQL is running
    if ! mysqladmin ping -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --silent; then
        echo "❌ Cannot connect to MySQL. Please check your credentials in .env"
        return 1
    fi
    
    # Create database if it doesn't exist
    mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS heva_db;"
    echo "✅ Database setup complete"
}

# Function to initialize data
initialize_data() {
    echo "📊 Initializing sample data..."
    python create_predefined_users.py
    python create_sample_beneficiaries.py
    echo "✅ Sample data initialization complete"
}

# Function to run migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    if command_exists flask; then
        flask db upgrade
    else
        echo "⚠️  Flask CLI not found, skipping migrations"
    fi
    echo "✅ Migrations complete"
}

# Function to start development server
start_dev_server() {
    echo "🌐 Starting development server..."
    echo "📍 Application will be available at http://localhost:5000"
    echo "🛑 Press Ctrl+C to stop the server"
    python app.py
}

# Function to setup production with Gunicorn
setup_production() {
    echo "🏭 Setting up production environment..."
    
    # Install Gunicorn if not already installed
    if ! command_exists gunicorn; then
        pip install gunicorn
    fi
    
    # Create Gunicorn config
    cat > gunicorn.conf.py << EOF
bind = "0.0.0.0:5000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2
EOF
    
    echo "✅ Production setup complete"
    echo "🚀 Start with: gunicorn -c gunicorn.conf.py app:app"
}

# Function to setup Docker
setup_docker() {
    echo "🐳 Setting up Docker deployment..."
    
    # Create Dockerfile if it doesn't exist
    if [ ! -f "Dockerfile" ]; then
        cat > Dockerfile << EOF
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
EOF
    fi
    
    # Create docker-compose.yml if it doesn't exist
    if [ ! -f "docker-compose.yml" ]; then
        cat > docker-compose.yml << EOF
version: '3.8'

services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MYSQL_HOST=db
      - MYSQL_USER=root
      - MYSQL_PASSWORD=heva_password
      - MYSQL_DB=heva_db
      - SECRET_KEY=your-secret-key-here
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: heva_password
      MYSQL_DATABASE: heva_db
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    restart: unless-stopped

volumes:
  mysql_data:
EOF
    fi
    
    echo "✅ Docker setup complete"
    echo "🚀 Start with: docker-compose up -d"
}

# Function to setup Nginx
setup_nginx() {
    echo "🌐 Setting up Nginx configuration..."
    
    # Create Nginx config
    sudo tee /etc/nginx/sites-available/heva << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://unix:/home/\$USER/heva-platform/heva.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /static {
        alias /home/\$USER/heva-platform/static;
        expires 30d;
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/heva /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    
    echo "✅ Nginx setup complete"
}

# Function to setup systemd service
setup_systemd() {
    echo "⚙️  Setting up systemd service..."
    
    sudo tee /etc/systemd/system/heva.service << EOF
[Unit]
Description=HEVA Platform
After=network.target

[Service]
User=\$USER
WorkingDirectory=\$(pwd)
Environment="PATH=\$(pwd)/venv/bin"
ExecStart=\$(pwd)/venv/bin/gunicorn --workers 3 --bind unix:heva.sock -m 007 app:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable heva
    sudo systemctl start heva
    
    echo "✅ Systemd service setup complete"
}

# Main deployment function
deploy() {
    local platform=$1
    
    echo "🎯 Deploying to: $platform"
    
    case $platform in
        "dev")
            check_python || exit 1
            setup_venv
            setup_env
            setup_database
            run_migrations
            initialize_data
            start_dev_server
            ;;
        "production")
            check_python || exit 1
            check_mysql || exit 1
            setup_venv
            setup_env
            setup_database
            run_migrations
            initialize_data
            setup_production
            setup_nginx
            setup_systemd
            echo "✅ Production deployment complete!"
            echo "🌐 Access your application at: http://your-domain.com"
            ;;
        "docker")
            check_python || exit 1
            setup_docker
            echo "✅ Docker setup complete!"
            echo "🐳 Run: docker-compose up -d"
            ;;
        "heroku")
            echo "🚀 Setting up Heroku deployment..."
            if ! command_exists heroku; then
                echo "❌ Heroku CLI not found. Please install it first."
                exit 1
            fi
            
            # Create Procfile
            echo "web: gunicorn app:app" > Procfile
            
            # Add gunicorn to requirements
            echo "gunicorn==20.1.0" >> requirements.txt
            
            echo "✅ Heroku setup complete!"
            echo "🚀 Deploy with: heroku create && git push heroku main"
            ;;
        *)
            echo "❌ Unknown platform: $platform"
            echo "Available platforms: dev, production, docker, heroku"
            exit 1
            ;;
    esac
}

# Function to show help
show_help() {
    echo "HEVA Platform Deployment Script"
    echo ""
    echo "Usage: $0 [PLATFORM]"
    echo ""
    echo "Platforms:"
    echo "  dev        - Development server (localhost:5000)"
    echo "  production - Production server with Nginx + Gunicorn"
    echo "  docker     - Docker container setup"
    echo "  heroku     - Heroku cloud deployment"
    echo ""
    echo "Examples:"
    echo "  $0 dev        # Start development server"
    echo "  $0 production # Deploy to production"
    echo "  $0 docker     # Setup Docker deployment"
    echo "  $0 heroku     # Setup Heroku deployment"
    echo ""
    echo "Prerequisites:"
    echo "  - Python 3.8+"
    echo "  - MySQL 8.0+"
    echo "  - Git"
    echo ""
    echo "For production deployment, you'll need:"
    echo "  - Ubuntu/Debian server"
    echo "  - Sudo access"
    echo "  - Domain name (optional)"
}

# Main script logic
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

case $1 in
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        deploy $1
        ;;
esac 