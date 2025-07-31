from flask import Blueprint, request, jsonify
from models import db, CreativeBusiness
from routes.auth import token_required

creative_bp = Blueprint('creative', __name__)

@creative_bp.route('/businesses', methods=['GET', 'POST'])
@token_required
def handle_businesses(current_user):
    if request.method == 'POST':
        data = request.get_json()
        business = CreativeBusiness(
            owner_id=data['owner_id'],
            business_model=data['business_model'],
            sector=data['sector'],
            risk_assessment=data.get('risk_assessment', 'medium')
        )
        db.session.add(business)
        db.session.commit()
        return jsonify({'id': business.business_id}), 201
    
    businesses = CreativeBusiness.query.all()
    return jsonify([{
        'id': b.business_id,
        'owner': b.owner_id,
        'model': b.business_model,
        'risk': b.risk_assessment
    } for b in businesses])

@creative_bp.route('/analytics/business-risk')
@token_required
def business_risk_analytics(current_user):
    if current_user.role not in ['admin', 'manager']:
        return jsonify({'message': 'Insufficient permissions'}), 403
        
    from sqlalchemy import func
    results = db.session.query(
        CreativeBusiness.risk_assessment,
        func.count(CreativeBusiness.business_id).label('count')
    ).group_by(CreativeBusiness.risk_assessment).all()
    
    return jsonify({
        'risk_distribution': {r.risk_assessment: r.count for r in results}
    })