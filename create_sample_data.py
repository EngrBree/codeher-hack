#!/usr/bin/env python3
"""
Script to create sample data for the HEVA system to demonstrate real-time dashboards
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, Beneficiary, VulnerabilityAssessment, FundingFlow, DigitalAccess, FinancialRecord
from datetime import datetime, timedelta
import random

def create_sample_data():
    """Create sample data for demonstration"""
    with app.app_context():
        print("Creating sample data for HEVA system...")
        
        # Create sample beneficiaries
        counties = ['Nairobi', 'Kisumu', 'Mombasa', 'Nakuru', 'Eldoret', 'Kakamega', 'Kisii', 'Machakos', 'Nyeri', 'Thika']
        vulnerability_types = ['poverty', 'refugee', 'disability', 'LGBTQI+', 'low_literacy', 'other']
        genders = ['Male', 'Female', 'Other']
        
        # Create 50 sample beneficiaries
        beneficiaries = []
        for i in range(50):
            beneficiary = Beneficiary(
                registration_date=datetime.now() - timedelta(days=random.randint(1, 180)),
                name=f"Beneficiary {i+1}",
                age=random.randint(18, 65),
                gender=random.choice(genders),
                vulnerability_type=random.choice(vulnerability_types),
                location=f"Location {i+1}",
                county=random.choice(counties),
                contact_info=f"+2547{random.randint(10000000, 99999999)}",
                is_high_risk=random.choice([True, False]),
                notes=f"Sample beneficiary {i+1}",
                funding_requested=random.choice([True, False]),
                funding_amount=random.randint(5000, 50000) if random.choice([True, False]) else None,
                funding_status=random.choice(['pending', 'approved', 'declined']) if random.choice([True, False]) else None
            )
            beneficiaries.append(beneficiary)
            db.session.add(beneficiary)
        
        db.session.commit()
        print(f"Created {len(beneficiaries)} beneficiaries")
        
        # Create sample vulnerability assessments
        assessments = []
        for beneficiary in beneficiaries:
            if random.choice([True, False]):  # 50% chance of having assessment
                assessment = VulnerabilityAssessment(
                    beneficiary_id=beneficiary.beneficiary_id,
                    assessor_id=1,  # Assuming admin user
                    assessment_date=beneficiary.registration_date + timedelta(days=random.randint(1, 30)),
                    poverty_score=random.randint(1, 5),
                    literacy_score=random.randint(1, 5),
                    digital_access_score=random.randint(1, 5),
                    disability_status=random.choice([True, False]),
                    lgbtqi_status=random.choice([True, False]),
                    refugee_status=random.choice([True, False])
                )
                assessments.append(assessment)
                db.session.add(assessment)
        
        db.session.commit()
        print(f"Created {len(assessments)} vulnerability assessments")
        
        # Create sample funding flows
        funding_flows = []
        program_names = ['Education Support', 'Healthcare Access', 'Livelihood Training', 'Housing Assistance', 'Digital Inclusion']
        
        for i in range(20):
            allocated = random.randint(10000, 100000)
            disbursed = random.randint(5000, allocated)
            
            flow = FundingFlow(
                program_name=random.choice(program_names),
                allocated_amount=allocated,
                disbursed_amount=disbursed,
                recipient_beneficiary_id=random.choice(beneficiaries).beneficiary_id if beneficiaries else None,
                disbursement_date=datetime.now() - timedelta(days=random.randint(1, 90)),
                reported_by=1,  # Assuming admin user
                audit_flag=random.choice([True, False]),
                notes=f"Sample funding flow {i+1}"
            )
            funding_flows.append(flow)
            db.session.add(flow)
        
        db.session.commit()
        print(f"Created {len(funding_flows)} funding flows")
        
        # Create sample digital access records
        digital_records = []
        for beneficiary in beneficiaries:
            if random.choice([True, False]):  # 50% chance of having digital access record
                digital = DigitalAccess(
                    beneficiary_id=beneficiary.beneficiary_id,
                    owns_smartphone=random.choice([True, False]),
                    internet_access=random.choice(['none', 'mobile_data', 'home_wifi', 'public_access']),
                    internet_affordability_score=random.randint(1, 5),
                    digital_literacy_score=random.randint(1, 5),
                    last_updated=datetime.now() - timedelta(days=random.randint(1, 30))
                )
                digital_records.append(digital)
                db.session.add(digital)
        
        db.session.commit()
        print(f"Created {len(digital_records)} digital access records")
        
        # Create sample financial records
        financial_records = []
        for beneficiary in beneficiaries:
            if random.choice([True, False]):  # 50% chance of having financial record
                financial = FinancialRecord(
                    beneficiary_id=beneficiary.beneficiary_id,
                    has_bank_account=random.choice([True, False]),
                    mobile_money_usage=random.choice([True, False]),
                    credit_access=random.choice(['none', 'informal', 'formal', 'microfinance']),
                    collateral_available=random.choice([True, False]),
                    financial_literacy_score=random.randint(1, 5),
                    risk_rating=random.choice(['low', 'medium', 'high']),
                    last_updated=datetime.now() - timedelta(days=random.randint(1, 30))
                )
                financial_records.append(financial)
                db.session.add(financial)
        
        db.session.commit()
        print(f"Created {len(financial_records)} financial records")
        
        print("\nSample data creation completed!")
        print("You can now log into the dashboards to see real-time data insights.")
        print("\nSample login credentials:")
        print("Admin: admin@heva / SecureAdmin123!")
        print("Manager: manager@heva / ManagerPass456!")
        print("Analyst: analyst@heva / AnalystAccess789!")

if __name__ == "__main__":
    create_sample_data() 