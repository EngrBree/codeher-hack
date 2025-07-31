from flask import Blueprint, request, jsonify
from models import db, DigitalAccess
from routes.auth import token_required

digital_bp = Blueprint('digital', __name__)

@digital_bp.route('/beneficiaries/<int:beneficiary_id>/digital', methods=['GET', 'POST'])
@token_required
def handle_digital_access(current_user, beneficiary_id):
    if request.method == 'POST':
        if current_user.role not in ['admin', 'field_agent']:
            return jsonify({'message': 'Insufficient permissions'}), 403
            
        data = request.get_json()
        access = DigitalAccess(
            beneficiary_id=beneficiary_id,
            owns_smartphone=data['owns_smartphone'],
            internet_access=data['internet_access'],
            digital_literacy_score=data.get('digital_literacy_score')
        )
        db.session.add(access)
        db.session.commit()
        return jsonify({'message': 'Digital access recorded'}), 201
    
    # GET digital access history
    records = DigitalAccess.query.filter_by(beneficiary_id=beneficiary_id).all()
    return jsonify([{
        'id': r.access_id,
        'has_phone': r.owns_smartphone,
        'internet_access': r.internet_access
    } for r in records])