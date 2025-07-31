from flask import Blueprint, request, jsonify
from models import db, FinancialRecord
from routes.auth import token_required

financial_bp = Blueprint('financial', __name__)

@financial_bp.route('/beneficiaries/<int:beneficiary_id>/financial', methods=['GET', 'POST'])
@token_required
def handle_financial_records(current_user, beneficiary_id):
    if request.method == 'POST':
        if current_user.role not in ['admin', 'analyst']:
            return jsonify({'message': 'Insufficient permissions'}), 403
            
        data = request.get_json()
        record = FinancialRecord(
            beneficiary_id=beneficiary_id,
            has_bank_account=data['has_bank_account'],
            financial_literacy_score=data.get('financial_literacy_score'),
            risk_rating=data['risk_rating']
        )
        db.session.add(record)
        db.session.commit()
        return jsonify({'message': 'Financial record added'}), 201
    
    # GET all financial records for beneficiary
    records = FinancialRecord.query.filter_by(beneficiary_id=beneficiary_id).all()
    return jsonify([{
        'id': r.record_id,
        'has_bank_account': r.has_bank_account,
        'risk_rating': r.risk_rating
    } for r in records])

@financial_bp.route('/analytics/financial-inclusion')
@token_required
def financial_analytics(current_user):
    if current_user.role not in ['admin', 'manager', 'analyst']:
        return jsonify({'message': 'Insufficient permissions'}), 403
        
    # Example aggregation query
    from sqlalchemy import func
    results = db.session.query(
        func.avg(FinancialRecord.financial_literacy_score).label('avg_score'),
        func.count(FinancialRecord.record_id).label('total_records')
    ).first()
    
    return jsonify({
        'average_financial_literacy': float(results.avg_score) if results.avg_score else 0,
        'total_assessed': results.total_records
    })