from flask import Blueprint, request, jsonify
from models import db, Beneficiary, VulnerabilityAssessment, FinancialRecord, DigitalAccess
from routes.auth import token_required

beneficiaries_bp = Blueprint('beneficiaries', __name__)

@beneficiaries_bp.route('/beneficiaries', methods=['GET', 'POST'])
@token_required
def handle_beneficiaries(current_user):
    if request.method == 'POST':
        if current_user.role not in ['admin', 'field_agent']:
            return jsonify({'message': 'Insufficient permissions'}), 403
            
        data = request.get_json()
        beneficiary = Beneficiary(
            name=data['name'],
            vulnerability_type=data['vulnerability_type'],
            age=data.get('age'),
            location=data.get('location'),
            contact_info=data.get('contact_info')
        )
        db.session.add(beneficiary)
        db.session.commit()
        return jsonify({'id': beneficiary.beneficiary_id}), 201
    
    # GET all beneficiaries (with pagination)
    page = request.args.get('page', 1, type=int)
    per_page = 20
    beneficiaries = Beneficiary.query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'items': [{
            'id': b.beneficiary_id,
            'name': b.name,
            'vulnerability_type': b.vulnerability_type,
            'age': b.age,
            'location': b.location,
            'contact_info': b.contact_info
        } for b in beneficiaries.items],
        'total': beneficiaries.total,
        'pages': beneficiaries.pages
    })

@beneficiaries_bp.route('/beneficiaries/<int:beneficiary_id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def handle_beneficiary(current_user, beneficiary_id):
    beneficiary = Beneficiary.query.get_or_404(beneficiary_id)
    
    if request.method == 'DELETE':
        if current_user.role not in ['admin', 'field_agent']:
            return jsonify({'message': 'Insufficient permissions'}), 403
        db.session.delete(beneficiary)
        db.session.commit()
        return jsonify({'message': 'Beneficiary deleted'}), 200
    
    elif request.method == 'PUT':
        if current_user.role not in ['admin', 'field_agent']:
            return jsonify({'message': 'Insufficient permissions'}), 403
        data = request.get_json()
        beneficiary.name = data.get('name', beneficiary.name)
        beneficiary.vulnerability_type = data.get('vulnerability_type', beneficiary.vulnerability_type)
        beneficiary.age = data.get('age', beneficiary.age)
        beneficiary.location = data.get('location', beneficiary.location)
        beneficiary.contact_info = data.get('contact_info', beneficiary.contact_info)
        db.session.commit()
        return jsonify({'message': 'Beneficiary updated'}), 200
    
    # GET beneficiary details
    return jsonify({
        'id': beneficiary.beneficiary_id,
        'name': beneficiary.name,
        'vulnerability_type': beneficiary.vulnerability_type,
        'age': beneficiary.age,
        'location': beneficiary.location,
        'contact_info': beneficiary.contact_info,
        'is_high_risk': beneficiary.is_high_risk
    })

@beneficiaries_bp.route('/assessments', methods=['GET', 'POST'])
@token_required
def handle_assessments(current_user):
    if request.method == 'POST':
        if current_user.role not in ['admin', 'field_agent']:
            return jsonify({'message': 'Insufficient permissions'}), 403
            
        data = request.get_json()
        assessment = VulnerabilityAssessment(
            beneficiary_id=data['beneficiary_id'],
            assessor_id=current_user.user_id,
            poverty_score=data['poverty_score'],
            literacy_score=data['literacy_score'],
            digital_access_score=data['digital_access_score'],
            disability_status=data.get('disability_status', False),
            lgbtqi_status=data.get('lgbtqi_status', False),
            refugee_status=data.get('refugee_status', False)
        )
        db.session.add(assessment)
        db.session.commit()
        return jsonify({'id': assessment.assessment_id}), 201
    
    # GET assessments for current user
    assessments = VulnerabilityAssessment.query.filter_by(assessor_id=current_user.user_id).all()
    
    return jsonify([{
        'assessment_id': a.assessment_id,
        'beneficiary_name': a.beneficiary.name,
        'assessment_date': a.assessment_date.isoformat(),
        'poverty_score': a.poverty_score,
        'literacy_score': a.literacy_score,
        'digital_access_score': a.digital_access_score,
        'disability_status': a.disability_status,
        'lgbtqi_status': a.lgbtqi_status,
        'refugee_status': a.refugee_status
    } for a in assessments])