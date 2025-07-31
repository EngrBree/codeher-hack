from flask import Blueprint, request, jsonify, current_app
from models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps

auth_bp = Blueprint('auth', __name__)

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
    data = request.get_json()
    
    # Validation
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    # Only allow field_agent role for self-registration
    if data.get('role', 'field_agent') != 'field_agent':
        return jsonify({'error': 'Only field agents can self-register'}), 403
    
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

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
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
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    user = User(
        username=data['username'],
        role=data['role'],
        is_predefined=True
    )
    user.set_password(data.get('password', 'TempPassword123!'))  # Default password
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': f'{data["role"]} user created successfully'}), 201

@auth_bp.route('/user/<int:user_id>', methods=['GET'])
@token_required
def get_user(current_user, user_id):
    # Users can only get their own data
    if current_user.user_id != user_id:
        return jsonify({'error': 'Unauthorized access'}), 403
    
    return jsonify({
        'user_id': current_user.user_id,
        'username': current_user.username,
        'full_name': current_user.full_name,
        'email': current_user.email,
        'role': current_user.role,
        'location': 'Nairobi',  # Default location for field agents
        'is_active': current_user.is_active
    }), 200