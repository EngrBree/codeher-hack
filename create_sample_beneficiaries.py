#!/usr/bin/env python3
"""
Script to create sample beneficiaries for testing funding requests
"""

from app import app, db
from models import Beneficiary
from datetime import datetime

def create_sample_beneficiaries():
    """Create sample beneficiaries for testing"""
    
    sample_beneficiaries = [
        {
            'name': 'John Doe',
            'age': 35,
            'gender': 'Male',
            'vulnerability_type': 'poverty',
            'location': 'Westlands, Nairobi',
            'county': 'Nairobi',
            'county_code': '047',
            'contact_info': '+254700123456',
            'is_high_risk': True,
            'notes': 'Single parent with 3 children, needs support for children education',
            'funding_requested': False,
            'funding_amount': 0,
            'funding_status': None,
            'funding_notes': None
        },
        {
            'name': 'Jane Smith',
            'age': 28,
            'gender': 'Female',
            'vulnerability_type': 'refugee',
            'location': 'Kisumu Central, Kisumu',
            'county': 'Kisumu',
            'county_code': '042',
            'contact_info': '+254700123457',
            'is_high_risk': True,
            'notes': 'Refugee from South Sudan, needs livelihood support',
            'funding_requested': False,
            'funding_amount': 0,
            'funding_status': None,
            'funding_notes': None
        },
        {
            'name': 'Michael Johnson',
            'age': 42,
            'gender': 'Male',
            'vulnerability_type': 'disability',
            'location': 'Old Town, Mombasa',
            'county': 'Mombasa',
            'county_code': '001',
            'contact_info': '+254700123458',
            'is_high_risk': True,
            'notes': 'Person with disability, needs assistive devices',
            'funding_requested': False,
            'funding_amount': 0,
            'funding_status': None,
            'funding_notes': None
        },
        {
            'name': 'Sarah Wilson',
            'age': 31,
            'gender': 'Female',
            'vulnerability_type': 'LGBTQI+',
            'location': 'Section 58, Nakuru',
            'county': 'Nakuru',
            'county_code': '032',
            'contact_info': '+254700123459',
            'is_high_risk': False,
            'notes': 'LGBTQI+ individual seeking community support',
            'funding_requested': False,
            'funding_amount': 0,
            'funding_status': None,
            'funding_notes': None
        },
        {
            'name': 'David Brown',
            'age': 39,
            'gender': 'Male',
            'vulnerability_type': 'low_literacy',
            'location': 'Langas, Eldoret',
            'county': 'Uasin Gishu',
            'county_code': '027',
            'contact_info': '+254700123460',
            'is_high_risk': True,
            'notes': 'Low literacy, needs skills training',
            'funding_requested': False,
            'funding_amount': 0,
            'funding_status': None,
            'funding_notes': None
        },
        {
            'name': 'Mary Kamau',
            'age': 45,
            'gender': 'Female',
            'vulnerability_type': 'poverty',
            'location': 'Kibera, Nairobi',
            'county': 'Nairobi',
            'county_code': '047',
            'contact_info': '+254700123461',
            'is_high_risk': True,
            'notes': 'Widow with 4 children, needs housing support',
            'funding_requested': False,
            'funding_amount': 0,
            'funding_status': None,
            'funding_notes': None
        },
        {
            'name': 'Peter Ochieng',
            'age': 33,
            'gender': 'Male',
            'vulnerability_type': 'refugee',
            'location': 'Kakuma, Turkana',
            'county': 'Turkana',
            'county_code': '023',
            'contact_info': '+254700123462',
            'is_high_risk': True,
            'notes': 'Refugee from DRC, needs business startup support',
            'funding_requested': False,
            'funding_amount': 0,
            'funding_status': None,
            'funding_notes': None
        },
        {
            'name': 'Grace Wanjiku',
            'age': 26,
            'gender': 'Female',
            'vulnerability_type': 'disability',
            'location': 'Thika, Kiambu',
            'county': 'Kiambu',
            'county_code': '022',
            'contact_info': '+254700123463',
            'is_high_risk': True,
            'notes': 'Person with visual impairment, needs training and equipment',
            'funding_requested': False,
            'funding_amount': 0,
            'funding_status': None,
            'funding_notes': None
        }
    ]
    
    with app.app_context():
        # Check if beneficiaries already exist
        existing_count = Beneficiary.query.count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} beneficiaries.")
            print("Skipping sample data creation.")
            return
        
        # Create sample beneficiaries
        for beneficiary_data in sample_beneficiaries:
            beneficiary = Beneficiary(**beneficiary_data)
            db.session.add(beneficiary)
        
        try:
            db.session.commit()
            print(f"Successfully created {len(sample_beneficiaries)} sample beneficiaries!")
            print("\nSample beneficiaries created:")
            for beneficiary in sample_beneficiaries:
                print(f"- {beneficiary['name']} ({beneficiary['vulnerability_type']}) from {beneficiary['county']}")
        except Exception as e:
            db.session.rollback()
            print(f"Error creating sample beneficiaries: {e}")

if __name__ == '__main__':
    create_sample_beneficiaries() 