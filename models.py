from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import logging
from sqlalchemy import text


db = SQLAlchemy()
class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('admin', 'manager', 'analyst', 'field_agent', 'partner', 'beneficiary', name='user_roles'), nullable=False)
    full_name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    is_predefined = db.Column(db.Boolean, default=False, nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    @classmethod
    def create_predefined_users(cls):
        """Creates system-critical users using direct SQL to avoid model dependency issues"""
        predefined_users = [
            {
                'username': 'admin@heva',
                'password': 'SecureAdmin123!',
                'role': 'admin',
                'full_name': 'System Administrator',
                'email': 'admin@heva.org'
            },
            {
                'username': 'manager@heva',
                'password': 'ManagerPass456!',
                'role': 'manager',
                'full_name': 'HEVA Manager',
                'email': 'manager@heva.org'
            },
            {
                'username': 'analyst@heva',
                'password': 'AnalystAccess789!',
                'role': 'analyst',
                'full_name': 'Financial Analyst',
                'email': 'analyst@heva.org'
            }
        ]
        
        try:
            for user_data in predefined_users:
                # Check if user exists using raw SQL
                
                print(f"Creating {user_data['username']}...")  # Debug print
                exists = db.session.execute(
                    text("SELECT 1 FROM users WHERE username = :username"),
                    {'username': user_data['username']}
                ).scalar()
                
                if not exists:
                    # Insert using raw SQL to avoid model dependency
                    db.session.execute(
                        text("""INSERT INTO users 
                        (username, password_hash, role, full_name, email, is_predefined, is_active)
                        VALUES 
                        (:username, :password_hash, :role, :full_name, :email, 1, 1)"""),
                        {
                            'username': user_data['username'],
                            'password_hash': generate_password_hash(user_data['password']),
                            'role': user_data['role'],
                            'full_name': user_data['full_name'],
                            'email': user_data['email']
                        }
                    )
                    logging.info(f"Created predefined user: {user_data['username']}")
            
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error creating predefined users: {str(e)}")
            return False

    @classmethod
    def create_field_agent(cls, username, password, full_name=None, email=None):
        """Proper method for creating field agents using ORM"""
        try:
            agent = cls(
                username=username,
                role='field_agent',
                full_name=full_name,
                email=email,
                is_predefined=False
            )
            agent.set_password(password)
            db.session.add(agent)
            db.session.commit()
            return agent
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error creating field agent: {str(e)}")
            return None

class Beneficiary(db.Model):
    """Individuals receiving support from HEVA"""
    __tablename__ = 'beneficiaries'
    
    beneficiary_id = db.Column(db.Integer, primary_key=True)
    registration_date = db.Column(db.Date, default=datetime.utcnow, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    vulnerability_type = db.Column(db.Enum('poverty', 'refugee', 'disability', 'LGBTQI+', 'low_literacy', 'other'), nullable=False)
    location = db.Column(db.String(100))
    county = db.Column(db.String(100))  # Kenya county
    county_code = db.Column(db.String(10))  # County code for easier querying
    contact_info = db.Column(db.String(100))
    is_high_risk = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    
    # Funding approval fields
    funding_requested = db.Column(db.Boolean, default=False)
    funding_amount = db.Column(db.Float)
    funding_status = db.Column(db.Enum('pending', 'approved', 'declined', name='funding_status'), default='pending')
    funding_approved_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    funding_approved_date = db.Column(db.DateTime)
    funding_notes = db.Column(db.Text)
    
    # Relationships
    assessments = db.relationship('VulnerabilityAssessment', backref='beneficiary', lazy=True)
    financial_records = db.relationship('FinancialRecord', backref='beneficiary', lazy=True)
    digital_access = db.relationship('DigitalAccess', backref='beneficiary', lazy=True)
    funding_flows = db.relationship('FundingFlow', backref='recipient', lazy=True)

class VulnerabilityAssessment(db.Model):
    """Vulnerability scoring for beneficiaries"""
    __tablename__ = 'vulnerability_assessments'
    
    assessment_id = db.Column(db.Integer, primary_key=True)
    beneficiary_id = db.Column(db.Integer, db.ForeignKey('beneficiaries.beneficiary_id'), nullable=False)
    assessor_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    assessment_date = db.Column(db.Date, default=datetime.utcnow, nullable=False)
    poverty_score = db.Column(db.Integer)  # 1-5 scale
    literacy_score = db.Column(db.Integer)  # 1-5 scale
    digital_access_score = db.Column(db.Integer)  # 1-5 scale
    disability_status = db.Column(db.Boolean, default=False)
    lgbtqi_status = db.Column(db.Boolean, default=False)
    refugee_status = db.Column(db.Boolean, default=False)

class FinancialRecord(db.Model):
    """Financial inclusion metrics"""
    __tablename__ = 'financial_records'
    
    record_id = db.Column(db.Integer, primary_key=True)
    beneficiary_id = db.Column(db.Integer, db.ForeignKey('beneficiaries.beneficiary_id'), nullable=False)
    has_bank_account = db.Column(db.Boolean, default=False)
    mobile_money_usage = db.Column(db.Boolean, default=False)
    credit_access = db.Column(db.Enum('none', 'informal', 'formal', 'microfinance'), nullable=False)
    collateral_available = db.Column(db.Boolean, default=False)
    financial_literacy_score = db.Column(db.Integer)  # 1-5 scale
    risk_rating = db.Column(db.Enum('low', 'medium', 'high'), nullable=False)
    last_updated = db.Column(db.Date, default=datetime.utcnow)

class DigitalAccess(db.Model):
    """Device and internet access tracking"""
    __tablename__ = 'digital_access'
    
    access_id = db.Column(db.Integer, primary_key=True)
    beneficiary_id = db.Column(db.Integer, db.ForeignKey('beneficiaries.beneficiary_id'), nullable=False)
    owns_smartphone = db.Column(db.Boolean, default=False)
    internet_access = db.Column(db.Enum('none', 'mobile_data', 'home_wifi', 'public_access'), nullable=False)
    internet_affordability_score = db.Column(db.Integer)  # 1-5 scale
    digital_literacy_score = db.Column(db.Integer)  # 1-5 scale
    last_updated = db.Column(db.Date, default=datetime.utcnow)

class FundingFlow(db.Model):
    """Tracking fund allocation and potential diversion"""
    __tablename__ = 'funding_flows'

    flow_id = db.Column(db.Integer, primary_key=True)
    program_name = db.Column(db.String(100), nullable=False)
    allocated_amount = db.Column(db.Numeric(12,2), nullable=False)
    disbursed_amount = db.Column(db.Numeric(12,2), nullable=False)
    recipient_beneficiary_id = db.Column(db.Integer, db.ForeignKey('beneficiaries.beneficiary_id'))
    disbursement_date = db.Column(db.Date)
    reported_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    audit_flag = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)

class CreativeBusiness(db.Model):
    """Creative sector business models"""
    __tablename__ = 'creative_businesses'
    
    business_id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('beneficiaries.beneficiary_id'), nullable=False)
    business_model = db.Column(db.String(100), nullable=False)  # e.g., freelance, cooperative
    sector = db.Column(db.String(50), nullable=False)  # e.g., music, crafts
    revenue_cycle = db.Column(db.Enum('daily', 'weekly', 'seasonal', 'irregular'))
    risk_assessment = db.Column(db.Enum('low', 'medium', 'high'))
    start_date = db.Column(db.Date)
    last_evaluation = db.Column(db.Date)