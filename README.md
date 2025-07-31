# HEVA (Humanitarian Empowerment & Vulnerability Assessment) Platform

🌐 **Live System:** [https://codeher-hack.onrender.com](https://codeher-hack.onrender.com)

🔐 **Test Login Credentials**  
| Role        | Username        | Password             |
|-------------|-----------------|----------------------|
| Field Agent | `jay`           | `Hello@12b`          |
| Manager     | `manager@heva`  | `ManagerPass456!`    |
| Admin       | `admin@heva`    | `SecureAdmin123!`    |
| Analyst     | `analyst@heva`  | `AnalystAccess789!`  |

> ⚠️ Use these accounts to explore different user roles and their dashboards.

---

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
...

### Option 2: AWS EC2 Deployment
...

### Option 3: Docker Deployment
...

## 🔐 User Management System
...

## 📊 Real-time Data Features
...

## 🔒 Security Features
...

## 📈 Monitoring & Analytics
...

## 🤝 Contributing
...

## 📄 License
...

## 🆘 Support
...

## 🚀 Roadmap
...
