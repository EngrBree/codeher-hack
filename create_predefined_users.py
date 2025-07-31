#!/usr/bin/env python3
"""
Script to create predefined users for HEVA platform
Run this script to add admin, manager, and analyst users to your database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User

def main():
    app = create_app()
    
    with app.app_context():
        print("Creating predefined users...")
        
        # Create predefined users
        if User.create_predefined_users():
            print("✅ Predefined users created successfully!")
            print("\nPredefined users:")
            print("- Username: admin@heva, Password: SecureAdmin123!")
            print("- Username: manager@heva, Password: ManagerPass456!")
            print("- Username: analyst@heva, Password: AnalystAccess789!")
        else:
            print("⚠️ Some predefined users may already exist or failed to create")
            
        # Verify users exist
        print("\nVerifying users in database:")
        users = User.query.all()
        for user in users:
            print(f"- {user.username} ({user.role})")

if __name__ == '__main__':
    main() 