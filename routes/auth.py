from flask import Blueprint, request, jsonify, current_app
from models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
from sqlalchemy.exc import OperationalError

auth_bp = Blueprint('auth', __name__)

def check_database_ready():
    """Check if database tables exist"""
    try:
        # Try to query the users table
        db.session.execute('SELECT 1 FROM users LIMIT 1')
        return True
    except OperationalError:
        return False

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing!'}), 403
        
        try:
            data = jwt.decode(token.split()[1], current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except Exception as e:
            return jsonify({'error': 'Token is invalid!', 'details': str(e)}), 403
        
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    # Check if database is ready
    if not check_database_ready():
        return jsonify({
            'error': 'Database not initialized. Please visit /init-db first.',
            'status': 'database_not_ready'
        }), 503
    
    data = request.get_json()
    
    # Validation
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    # Only allow field_agent role for self-registration
    if data.get('role', 'field_agent') != 'field_agent':
        return jsonify({'error': 'Only field agents can self-register'}), 403
    
    try:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        # Create user
        user = User(
            username=data['username'],
            role='field_agent',  # Force field_agent role
            full_name=data.get('fullName', data['username']),  # Use fullName if provided, otherwise username
            email=data.get('email'),
            is_predefined=False
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'Field agent registered successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    # Check if database is ready
    if not check_database_ready():
        return jsonify({
            'error': 'Database not initialized. Please visit /init-db first.',
            'status': 'database_not_ready'
        }), 503
    
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    try:
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.user_id,
            'role': user.role,
            'full_name': user.full_name,
            'location': 'Nairobi',  # Default location for field agents
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            'token': token,
            'user_id': user.user_id,
            'role': user.role,
            'is_predefined': user.is_predefined
        }), 200
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/admin/create-user', methods=['POST'])
@token_required
def admin_create_user(current_user):
    # Only admin can create non-field-agent users
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('role'):
        return jsonify({'error': 'Username and role required'}), 400
    
    valid_roles = ['manager', 'analyst']
    if data['role'] not in valid_roles:
        return jsonify({'error': f'Invalid role. Allowed: {", ".join(valid_roles)}'}), 400
    
    try:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        user = User(
            username=data['username'],
            role=data['role'],
            full_name=data.get('full_name', data['username']),
            email=data.get('email'),
            is_predefined=False
        )
        user.set_password(data.get('password', 'default123'))
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': f'{data["role"].title()} user created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'User creation failed: {str(e)}'}), 500

@auth_bp.route('/user/<int:user_id>', methods=['GET'])
@token_required
def get_user(current_user, user_id):
    # Users can only get their own data
    if current_user.user_id != user_id and current_user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user_id': user.user_id,
            'username': user.username,
            'role': user.role,
            'full_name': user.full_name,
            'email': user.email,
            'is_active': user.is_active,
            'last_login': user.last_login.isoformat() if user.last_login else None
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get user: {str(e)}'}), 500

@auth_bp.route('/users', methods=['GET'])
@token_required
def get_users(current_user):
    # Only admin can list all users
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        users = User.query.all()
        users_data = []
        
        for user in users:
            users_data.append({
                'user_id': user.user_id,
                'username': user.username,
                'role': user.role,
                'full_name': user.full_name,
                'email': user.email,
                'is_active': user.is_active,
                'is_predefined': user.is_predefined,
                'last_login': user.last_login.isoformat() if user.last_login else None
            })
        
        return jsonify({'users': users_data}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get users: {str(e)}'}), 500

@auth_bp.route('/user/<int:user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    # Only admin can update users
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'email' in data:
            user.email = data['email']
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({'message': 'User updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update user: {str(e)}'}), 500

@auth_bp.route('/user/<int:user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user, user_id):
    # Only admin can delete users
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Don't allow deletion of predefined users
        if user.is_predefined:
            return jsonify({'error': 'Cannot delete predefined users'}), 403
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete user: {str(e)}'}), 500