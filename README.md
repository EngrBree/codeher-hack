HEVA (Humanitarian Empowerment & Vulnerability Assessment) Platform
🌐 Live System: https://codeher-hack.onrender.com

🔐 Test Login Credentials

-#Role	#Username	#Password
-Field Agent	jay	Hello@12b
-Manager	manager@heva	ManagerPass456!
--Admin	admin@heva	SecureAdmin123!
-Analyst	analyst@heva	AnalystAccess789!

⚠️ Use these accounts to explore different user roles and their dashboards.




### Overview
HEVA is a comprehensive humanitarian aid management platform designed to streamline the process of identifying, assessing, and supporting vulnerable populations in Kenya. The platform addresses critical gaps in humanitarian aid distribution by providing real-time data analytics, secure funding tracking, and multi-stakeholder collaboration tools.

### Key Problems Solved
1. **Fragmented Data Management**: Centralizes beneficiary information across multiple vulnerability types
2. **Lack of Real-time Monitoring**: Provides live dashboards for tracking aid distribution
3. **Funding Transparency**: Implements secure funding flow tracking to prevent diversion
4. **Limited Accessibility**: Multi-role system for field agents, managers, and analysts
5. **Data-Driven Decisions**: Analytics and reporting for evidence-based interventions

### Target Users
- **Field Agents**: On-ground data collection and beneficiary assessment
- **Managers**: Oversight and approval of funding requests
- **Analysts**: Data analysis and reporting
- **Administrators**: System management and user verification
- **Beneficiaries**: Direct access to their support information

### Core Features
- ✅ Real-time beneficiary tracking
- ✅ Vulnerability assessment tools
- ✅ Funding request and approval system
- ✅ Multi-role access control
- ✅ Data analytics and reporting
- ✅ Mobile-responsive design
- ✅ Secure authentication system

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MySQL 8.0+
  

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/heva-platform.git
cd heva-platform
```

2. **Set up virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. **Set up database**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE heva_db;
```

6. **Initialize database**
```bash
python create_predefined_users.py
python create_sample_beneficiaries.py
```

7. **Run the application**
```bash
python app.py
```

The application will be available at `http://localhost:5000`

## 🔧 Configuration

### Environment Variables (.env)
```env
SECRET_KEY=your-secret-key-here
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_HOST=127.0.0.1
MYSQL_DB=heva_db
```

### Database Setup
The platform uses MySQL for data persistence. Key tables include:
- `users`: User accounts and roles
- `beneficiaries`: Beneficiary information
- `vulnerability_assessments`: Assessment data
- `funding_flows`: Funding tracking
- `financial_records`: Financial inclusion data

## 🌐 Deployment Guide

### Option 1: Heroku Deployment

1. **Prepare for Heroku**
```bash
# Create Procfile
echo "web: gunicorn app:app" > Procfile

# Add gunicorn to requirements
echo "gunicorn==20.1.0" >> requirements.txt
```

2. **Deploy to Heroku**
```bash
heroku create heva-platform
heroku config:set SECRET_KEY=your-secret-key
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

### Option 2: AWS EC2 Deployment

1. **Launch EC2 Instance**
```bash
# Ubuntu 20.04 LTS
# t2.micro (free tier) or larger
```

2. **Install dependencies**
```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx mysql-server
```

3. **Set up MySQL**
```bash
sudo mysql_secure_installation
sudo mysql -u root -p
CREATE DATABASE heva_db;
CREATE USER 'heva_user'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON heva_db.* TO 'heva_user'@'localhost';
FLUSH PRIVILEGES;
```

4. **Deploy application**
```bash
# Clone repository
git clone https://github.com/your-username/heva-platform.git
cd heva-platform

# Set up virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with production settings
```

5. **Set up Gunicorn service**
```bash
sudo nano /etc/systemd/system/heva.service
```

Add:
```ini
[Unit]
Description=HEVA Platform
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/heva-platform
Environment="PATH=/home/ubuntu/heva-platform/venv/bin"
ExecStart=/home/ubuntu/heva-platform/venv/bin/gunicorn --workers 3 --bind unix:heva.sock -m 007 app:app

[Install]
WantedBy=multi-user.target
```

6. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/heva
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/heva-platform/heva.sock;
    }
}
```

7. **Enable services**
```bash
sudo ln -s /etc/nginx/sites-available/heva /etc/nginx/sites-enabled
sudo systemctl start heva
sudo systemctl enable heva
sudo systemctl restart nginx
```

### Option 3: Docker Deployment

1. **Create Dockerfile**
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

2. **Create docker-compose.yml**
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MYSQL_HOST=db
    depends_on:
      - db
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: your-password
      MYSQL_DATABASE: heva_db
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

3. **Deploy with Docker**
```bash
docker-compose up -d
```

## 🔐 User Management System

### User Registration and Access

1. **Field Agent Registration**
- Field agents can self-register through the platform
- Registration requires basic information (username, password, full name, email)
- All field agents are automatically approved upon registration
- No manual verification process required

2. **Admin User Management**
- Admins can create additional users (managers, analysts)
- User roles are managed through the admin interface
- All users have immediate access to their respective dashboards

3. **Access Control**
- Role-based access control for different user types
- Field agents: Beneficiary management and funding requests
- Managers: Oversight and approval of funding requests
- Analysts: Data analysis and reporting
- Admins: System management and user administration

## 📊 Real-time Data Features

### Live Dashboard Updates
- Automatic data refresh every 30 seconds
- Real-time beneficiary statistics
- Live funding tracking
- Activity feed updates
- Gender and region analytics

### Data Visualization
- Interactive charts for demographics
- Funding flow diagrams
- Vulnerability type distributions
- Geographic heat maps
- Trend analysis

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Session management
- Password encryption
- API rate limiting

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens
- Secure headers

## 📈 Monitoring & Analytics

### Performance Monitoring
- Application performance metrics
- Database query optimization
- Error tracking and logging
- User activity monitoring
- System health checks

### Business Intelligence
- Beneficiary demographics
- Funding distribution analysis
- Vulnerability trend analysis
- Geographic impact assessment
- ROI measurement

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@heva-platform.com
- Documentation: https://docs.heva-platform.com
- Issues: https://github.com/your-username/heva-platform/issues

## 🚀 Roadmap

### Phase 1 (Current)
- ✅ Core platform development
- ✅ User authentication
- ✅ Basic dashboard
- ✅ Funding tracking

### Phase 2 (Next)
- 🔄 Mobile app development
- 🔄 Advanced analytics
- 🔄 API integrations
- 🔄 Multi-language support
  

### Phase 3 (Future)
- 📋 AI-powered assessments
- 📋 Blockchain integration
- 📋 IoT device integration
- 📋 Advanced reporting

---

**HEVA Platform** - Empowering humanitarian aid through technology and data-driven decisions. 
