from flask import Blueprint, jsonify, request
from routes.auth import token_required
from models import db, Beneficiary, VulnerabilityAssessment
from datetime import datetime, timedelta

field_agent_bp = Blueprint('field_agent', __name__)

@field_agent_bp.route('/stats')
@token_required
def get_stats(current_user):
    if current_user.role not in ['field_agent', 'admin', 'manager']:
        return jsonify({'error': 'Field agent, admin, or manager access only'}), 403
    
    try:
        # Get real stats from database
        total_beneficiaries = Beneficiary.query.count()
        
        # Count assessments this month
        start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        assessments_this_month = VulnerabilityAssessment.query.filter(
            VulnerabilityAssessment.assessor_id == current_user.user_id,
            VulnerabilityAssessment.assessment_date >= start_of_month
        ).count()
        
        # Count high risk cases (beneficiaries with high vulnerability scores)
        high_risk_cases = Beneficiary.query.filter_by(is_high_risk=True).count()
        
        # Get gender distribution
        gender_stats = db.session.query(
            Beneficiary.gender,
            db.func.count(Beneficiary.beneficiary_id)
        ).filter(Beneficiary.gender.isnot(None)).group_by(Beneficiary.gender).all()
        
        gender_distribution = {gender: count for gender, count in gender_stats}
        
        # Get region/county distribution
        region_stats = db.session.query(
            Beneficiary.county,
            db.func.count(Beneficiary.beneficiary_id)
        ).filter(Beneficiary.county.isnot(None)).group_by(Beneficiary.county).all()
        
        region_distribution = {county: count for county, count in region_stats}
        
        # Get vulnerability type distribution
        vulnerability_stats = db.session.query(
            Beneficiary.vulnerability_type,
            db.func.count(Beneficiary.beneficiary_id)
        ).group_by(Beneficiary.vulnerability_type).all()
        
        vulnerability_distribution = {vuln_type: count for vuln_type, count in vulnerability_stats}
        
        return jsonify({
            'total_beneficiaries': total_beneficiaries,
            'assessments_this_month': assessments_this_month,
            'high_risk_cases': high_risk_cases,
            'gender_distribution': gender_distribution,
            'region_distribution': region_distribution,
            'vulnerability_distribution': vulnerability_distribution,
            'last_updated': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error retrieving stats: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@field_agent_bp.route('/activity')
@token_required
def get_activity(current_user):
    if current_user.role not in ['field_agent', 'admin', 'manager']:
        return jsonify({'error': 'Field agent, admin, or manager access only'}), 403
    
    # Get recent activities (assessments and beneficiary additions)
    recent_assessments = VulnerabilityAssessment.query.filter_by(
        assessor_id=current_user.user_id
    ).order_by(VulnerabilityAssessment.assessment_date.desc()).limit(10).all()
    
    activities = []
    for assessment in recent_assessments:
        activities.append({
            'description': f'Completed assessment for {assessment.beneficiary.name}',
            'timestamp': assessment.assessment_date.isoformat(),
            'icon': 'fa-clipboard-check'
        })
    
    # Add some mock activities for demonstration
    activities.extend([
        {
            'description': 'Added new beneficiary: John Doe',
            'timestamp': (datetime.now() - timedelta(hours=2)).isoformat(),
            'icon': 'fa-user-plus'
        },
        {
            'description': 'Generated monthly report',
            'timestamp': (datetime.now() - timedelta(days=1)).isoformat(),
            'icon': 'fa-file-export'
        }
    ])
    
    # Sort by timestamp (most recent first)
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify(activities[:10])  # Return only 10 most recent

@field_agent_bp.route('/beneficiaries')
@token_required
def get_beneficiaries(current_user):
    if current_user.role not in ['field_agent', 'admin', 'manager']:
        return jsonify({'error': 'Field agent, admin, or manager access only'}), 403
    
    try:
        # Get all beneficiaries for funding requests
        beneficiaries = Beneficiary.query.all()
        
        if not beneficiaries:
            return jsonify({'message': 'No beneficiaries found in database', 'beneficiaries': []})
        
        beneficiaries_data = []
        for beneficiary in beneficiaries:
            beneficiaries_data.append({
                'beneficiary_id': beneficiary.beneficiary_id,
                'name': beneficiary.name,
                'vulnerability_type': beneficiary.vulnerability_type,
                'county': beneficiary.county,
                'funding_status': beneficiary.funding_status or 'not_requested',
                'funding_amount': beneficiary.funding_amount or 0
            })
        
        return jsonify(beneficiaries_data)
        
    except Exception as e:
        print(f"Error retrieving beneficiaries: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@field_agent_bp.route('/report', methods=['POST'])
@token_required
def generate_report(current_user):
    if current_user.role not in ['field_agent', 'admin', 'manager']:
        return jsonify({'error': 'Field agent, admin, or manager access only'}), 403
    
    # Get comprehensive report data
    total_beneficiaries = Beneficiary.query.count()
    
    start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    assessments_this_month = VulnerabilityAssessment.query.filter(
        VulnerabilityAssessment.assessor_id == current_user.user_id,
        VulnerabilityAssessment.assessment_date >= start_of_month
    ).count()
    
    high_risk_cases = Beneficiary.query.filter_by(is_high_risk=True).count()
    
    # Get recent activities for the report
    recent_activities = VulnerabilityAssessment.query.filter_by(
        assessor_id=current_user.user_id
    ).order_by(VulnerabilityAssessment.assessment_date.desc()).limit(5).all()
    
    activities = []
    for assessment in recent_activities:
        activities.append({
            'description': f'Assessment completed for {assessment.beneficiary.name}',
            'timestamp': assessment.assessment_date.isoformat()
        })
    
    return jsonify({
        'total_beneficiaries': total_beneficiaries,
        'assessments_this_month': assessments_this_month,
        'high_risk_cases': high_risk_cases,
        'recent_activities': activities,
        'generated_at': datetime.now().isoformat(),
        'field_agent': current_user.full_name
    })

@field_agent_bp.route('/funding/tracking')
@token_required
def get_funding_tracking(current_user):
    if current_user.role not in ['field_agent', 'admin', 'manager']:
        return jsonify({'error': 'Field agent, admin, or manager access only'}), 403
    
    try:
        # Get all beneficiaries with funding information
        beneficiaries = Beneficiary.query.filter(
            Beneficiary.funding_requested == True
        ).all()
        
        if not beneficiaries:
            return jsonify({'message': 'No funding requests found', 'beneficiaries': []})
        
        tracking_data = []
        for b in beneficiaries:
            tracking_data.append({
                'beneficiary_id': b.beneficiary_id,
                'name': b.name,
                'vulnerability_type': b.vulnerability_type,
                'gender': b.gender,
                'location': b.location,
                'county': b.county,
                'funding_amount': b.funding_amount,
                'funding_status': b.funding_status,
                'funding_notes': b.funding_notes,
                'registration_date': b.registration_date.isoformat() if b.registration_date else None,
                'funding_approved_date': b.funding_approved_date.isoformat() if b.funding_approved_date else None
            })
        
        return jsonify(tracking_data)
        
    except Exception as e:
        print(f"Error retrieving funding tracking data: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@field_agent_bp.route('/funding/stats')
@token_required
def get_funding_stats(current_user):
    if current_user.role not in ['field_agent', 'admin', 'manager']:
        return jsonify({'error': 'Field agent, admin, or manager access only'}), 403
    
    try:
        # Count beneficiaries with funding requests
        tracked_beneficiaries = Beneficiary.query.filter_by(
            funding_requested=True
        ).count()
        
        # Count approved funds
        approved_funds = Beneficiary.query.filter_by(
            funding_status='approved'
        ).count()
        
        # Count pending funds
        pending_funds = Beneficiary.query.filter_by(
            funding_status='pending'
        ).count()
        
        # Count declined funds
        declined_funds = Beneficiary.query.filter_by(
            funding_status='declined'
        ).count()
        
        # Calculate total approved amount
        approved_beneficiaries = Beneficiary.query.filter_by(funding_status='approved').all()
        total_approved_amount = sum(b.funding_amount or 0 for b in approved_beneficiaries)
        
        return jsonify({
            'tracked_beneficiaries': tracked_beneficiaries,
            'approved_funds': approved_funds,
            'pending_funds': pending_funds,
            'declined_funds': declined_funds,
            'total_approved_amount': total_approved_amount
        })
        
    except Exception as e:
        print(f"Error retrieving funding stats: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@field_agent_bp.route('/funding/report', methods=['GET'])
@token_required
def get_funding_report(current_user):
    """Get comprehensive funding report for field agent"""
    if current_user.role not in ['field_agent', 'admin', 'manager']:
        return jsonify({'error': 'Field agent, admin, or manager access only'}), 403
    
    try:
        # Get all beneficiaries with funding information
        all_beneficiaries = Beneficiary.query.filter(
            Beneficiary.funding_requested == True
        ).all()
        
        # Categorize by status
        approved_beneficiaries = [b for b in all_beneficiaries if b.funding_status == 'approved']
        pending_beneficiaries = [b for b in all_beneficiaries if b.funding_status == 'pending']
        declined_beneficiaries = [b for b in all_beneficiaries if b.funding_status == 'declined']
        
        # Calculate totals
        total_approved_amount = sum(b.funding_amount or 0 for b in approved_beneficiaries)
        total_pending_amount = sum(b.funding_amount or 0 for b in pending_beneficiaries)
        
        # Prepare detailed data
        def prepare_beneficiary_data(beneficiaries):
            return [{
                'beneficiary_id': b.beneficiary_id,
                'name': b.name,
                'vulnerability_type': b.vulnerability_type,
                'county': b.county,
                'funding_amount': b.funding_amount,
                'funding_notes': b.funding_notes,
                'registration_date': b.registration_date.isoformat() if b.registration_date else None,
                'funding_approved_date': b.funding_approved_date.isoformat() if b.funding_approved_date else None
            } for b in beneficiaries]
        
        return jsonify({
            'summary': {
                'total_requests': len(all_beneficiaries),
                'approved_count': len(approved_beneficiaries),
                'pending_count': len(pending_beneficiaries),
                'declined_count': len(declined_beneficiaries),
                'total_approved_amount': total_approved_amount,
                'total_pending_amount': total_pending_amount
            },
            'approved_beneficiaries': prepare_beneficiary_data(approved_beneficiaries),
            'pending_beneficiaries': prepare_beneficiary_data(pending_beneficiaries),
            'declined_beneficiaries': prepare_beneficiary_data(declined_beneficiaries),
            'report_generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error generating funding report: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@field_agent_bp.route('/funding/request', methods=['POST'])
@token_required
def request_funding(current_user):
    if current_user.role not in ['field_agent', 'admin', 'manager']:
        return jsonify({'error': 'Field agent, admin, or manager access only'}), 403
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        beneficiary_id = data.get('beneficiary_id')
        amount = data.get('amount')
        notes = data.get('notes', '')
        
        if not beneficiary_id:
            return jsonify({'error': 'Beneficiary ID is required'}), 400
            
        if not amount:
            return jsonify({'error': 'Funding amount is required'}), 400
        
        beneficiary = Beneficiary.query.get(beneficiary_id)
        if not beneficiary:
            return jsonify({'error': f'Beneficiary with ID {beneficiary_id} not found'}), 404
        
        beneficiary.funding_requested = True
        beneficiary.funding_amount = float(amount)
        beneficiary.funding_status = 'pending'
        beneficiary.funding_notes = notes
        
        db.session.commit()
        
        return jsonify({
            'message': 'Funding request submitted successfully',
            'beneficiary_id': beneficiary_id,
            'amount': amount,
            'status': 'pending'
        })
        
    except ValueError as e:
        return jsonify({'error': f'Invalid amount format: {str(e)}'}), 400
    except Exception as e:
        print(f"Error in funding request: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

