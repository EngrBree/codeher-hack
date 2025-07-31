#!/usr/bin/env python3
"""
Script to check existing users in HEVA database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User

def main():
    app = create_app()
    
    with app.app_context():
        print("Checking existing users in database...")
        
        users = User.query.all()
        
        if not users:
            print("❌ No users found in database")
            print("Run create_predefined_users.py to add predefined users")
        else:
            print(f"✅ Found {len(users)} user(s) in database:")
            print("-" * 50)
            for user in users:
                print(f"ID: {user.user_id}")
                print(f"Username: {user.username}")
                print(f"Role: {user.role}")
                print(f"Full Name: {user.full_name}")
                print(f"Email: {user.email}")
                print(f"Active: {user.is_active}")
                print(f"Predefined: {user.is_predefined}")
                print("-" * 50)

if __name__ == '__main__':
    main() 