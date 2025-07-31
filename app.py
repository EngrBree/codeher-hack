from flask import Flask, jsonify, render_template, redirect, url_for, request, send_file
import logging
import jwt
from datetime import datetime
from config import Config
from models import db, User, Beneficiary, VulnerabilityAssessment, FinancialRecord, DigitalAccess, FundingFlow, CreativeBusiness  # Import all models
from routes.auth import auth_bp, token_required
from routes.beneficiaries import beneficiaries_bp
from routes.financial import financial_bp
from routes.funding import funding_bp
from routes.digital import digital_bp
from routes.creative import creative_bp
from flask_migrate import Migrate
from routes.field_agent import field_agent_bp
from routes.analyst import analyst_bp
from routes.admin import admin_bp
from routes.manager import manager_bp
from pdf_generator import PDFGenerator
from kenya_counties import KENYA_COUNTIES



def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize logging
    logging.basicConfig(level=logging.DEBUG)
    app.logger.info("Starting HEVA backend...")
    
    # Initialize database
    db.init_app(app)
    migrate = Migrate(app, db)  # Initialize Flask-Migrate
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(beneficiaries_bp, url_prefix='/api/beneficiaries')
    app.register_blueprint(financial_bp, url_prefix='/api/financial')
    app.register_blueprint(funding_bp, url_prefix='/api/funding')
    app.register_blueprint(digital_bp, url_prefix='/api/digital')
    app.register_blueprint(creative_bp, url_prefix='/api/creative')
    app.register_blueprint(field_agent_bp, url_prefix='/api/field_agent')
    app.register_blueprint(analyst_bp, url_prefix='/api/analyst')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(manager_bp, url_prefix='/api/manager')

    @app.route('/')
    def home():
        """Main landing page that all users see first"""
        return render_template('index.html')

    @app.route('/login')
    def login_page():
        return render_template('auth/login.html')

    @app.route('/register')
    def register_page():
        return render_template('auth/register.html')

    @app.route('/dashboard')
    def dashboard():
        # For now, render the dashboard template without authentication
        # The frontend will handle authentication via API calls
        # This allows the page to load and then the JS can check auth status
        return render_template('field_agent/dashboard.html')

    @app.route('/analyst-dashboard')
    def analyst_dashboard():
        return render_template('analyst/dashboard.html')

    @app.route('/admin-dashboard')
    def admin_dashboard():
        return render_template('admin/dashboard.html')

    @app.route('/manager-dashboard')
    def manager_dashboard():
        return render_template('manager/dashboard.html')
    
    # PDF Download Routes
    @app.route('/api/download/beneficiary-report')
    def download_beneficiary_report():
        """Download beneficiary report as PDF"""
        try:
            # Get beneficiaries data from database
            beneficiaries = Beneficiary.query.all()
            beneficiaries_data = []
            
            for beneficiary in beneficiaries:
                beneficiaries_data.append({
                    'name': beneficiary.name,
                    'age': beneficiary.age,
                    'gender': beneficiary.gender,
                    'vulnerability_type': beneficiary.vulnerability_type,
                    'location': beneficiary.location,
                    'county': beneficiary.county,
                    'funding_status': beneficiary.funding_status
                })
            
            # Generate PDF
            pdf_generator = PDFGenerator()
            pdf_buffer = pdf_generator.generate_beneficiary_report(beneficiaries_data)
            
            return send_file(
                pdf_buffer,
                as_attachment=True,
                download_name=f'beneficiary_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf',
                mimetype='application/pdf'
            )
        except Exception as e:
            app.logger.error(f"Error generating beneficiary report: {e}")
            return jsonify({'error': 'Failed to generate report'}), 500
    
    @app.route('/api/download/funding-report')
    def download_funding_report():
        """Download funding report as PDF"""
        try:
            # Get funding data from database
            funding_flows = FundingFlow.query.all()
            funding_data = []
            
            for flow in funding_flows:
                funding_data.append({
                    'program_name': flow.program_name,
                    'allocated_amount': float(flow.allocated_amount),
                    'disbursed_amount': float(flow.disbursed_amount),
                    'disbursement_date': flow.disbursement_date.strftime('%Y-%m-%d') if flow.disbursement_date else 'N/A'
                })
            
            # Generate PDF
            pdf_generator = PDFGenerator()
            pdf_buffer = pdf_generator.generate_funding_report(funding_data)
            
            return send_file(
                pdf_buffer,
                as_attachment=True,
                download_name=f'funding_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf',
                mimetype='application/pdf'
            )
        except Exception as e:
            app.logger.error(f"Error generating funding report: {e}")
            return jsonify({'error': 'Failed to generate report'}), 500
    
    @app.route('/api/download/dashboard-report/<user_role>')
    def download_dashboard_report(user_role):
        """Download dashboard report as PDF"""
        try:
            # Get dashboard data based on user role
            dashboard_data = {}
            
            if user_role == 'admin':
                dashboard_data = {
                    'total_beneficiaries': Beneficiary.query.count(),
                    'total_users': User.query.count(),
                    'active_programs': FundingFlow.query.count(),
                    'system_health': 100,
                    'recent_activity': []
                }
            elif user_role == 'manager':
                dashboard_data = {
                    'total_beneficiaries': Beneficiary.query.count(),
                    'active_programs': FundingFlow.query.count(),
                    'fund_utilization': 85,
                    'impact_score': 92,
                    'recent_activity': []
                }
            elif user_role == 'analyst':
                dashboard_data = {
                    'total_beneficiaries': Beneficiary.query.count(),
                    'total_assessments': VulnerabilityAssessment.query.count(),
                    'high_risk_cases': Beneficiary.query.filter_by(is_high_risk=True).count(),
                    'avg_vulnerability_score': 3.2,
                    'recent_activity': []
                }
            
            # Generate PDF
            pdf_generator = PDFGenerator()
            pdf_buffer = pdf_generator.generate_dashboard_report(dashboard_data, user_role)
            
            return send_file(
                pdf_buffer,
                as_attachment=True,
                download_name=f'{user_role}_dashboard_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf',
                mimetype='application/pdf'
            )
        except Exception as e:
            app.logger.error(f"Error generating dashboard report: {e}")
            return jsonify({'error': 'Failed to generate report'}), 500
    
    @app.route('/api/counties')
    def get_counties():
        """Get Kenya counties data"""
        return jsonify(KENYA_COUNTIES)
    
    @app.route('/health')
    def health_check():
        """Health check endpoint"""
        try:
            # Test database connection
            db.session.execute('SELECT 1')
            db_status = "connected"
        except Exception as e:
            app.logger.warning(f"Database connection failed: {e}")
            db_status = "disconnected"
        
        return jsonify({
            'status': 'healthy',
            'database': db_status,
            'timestamp': datetime.now().isoformat()
        })
    
    @app.route('/db-status')
    def database_status():
        """Check database tables status"""
        try:
            # Check if users table exists
            db.session.execute('SELECT 1 FROM users LIMIT 1')
            users_table = "exists"
        except Exception as e:
            users_table = "missing"
        
        try:
            # Check if beneficiaries table exists
            db.session.execute('SELECT 1 FROM beneficiaries LIMIT 1')
            beneficiaries_table = "exists"
        except Exception as e:
            beneficiaries_table = "missing"
        
        try:
            # Count users
            user_count = db.session.execute('SELECT COUNT(*) FROM users').scalar()
        except Exception as e:
            user_count = 0
        
        try:
            # Count beneficiaries
            beneficiary_count = db.session.execute('SELECT COUNT(*) FROM beneficiaries').scalar()
        except Exception as e:
            beneficiary_count = 0
        
        return jsonify({
            'database_ready': users_table == "exists" and beneficiaries_table == "exists",
            'tables': {
                'users': users_table,
                'beneficiaries': beneficiaries_table
            },
            'counts': {
                'users': user_count,
                'beneficiaries': beneficiary_count
            },
            'timestamp': datetime.now().isoformat()
        })
    
    @app.route('/init-db')
    def initialize_database():
        """Initialize database tables and create predefined users"""
        try:
            app.logger.info("Initializing database...")
            
            # Create all tables (only for initial setup)
            db.create_all()
            app.logger.info("✅ Database tables created successfully!")
            
            # Create predefined users
            app.logger.info("Creating predefined users...")
            if User.create_predefined_users():
                app.logger.info("✅ Predefined users created successfully!")
            else:
                app.logger.warning("⚠️ Some predefined users may already exist or failed to create")
                
            return jsonify({
                'status': 'success',
                'message': 'Database initialized successfully',
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            app.logger.error(f"❌ Database initialization failed: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Database initialization failed: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    return app

# Create the app instance for gunicorn
app = create_app()

if __name__ == '__main__':
    app.logger.info("Running Flask app...")
    app.run(debug=True, host='0.0.0.0', port=5000)