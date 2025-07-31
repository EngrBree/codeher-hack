from flask import Blueprint, request, jsonify
from models import db, FundingFlow, Beneficiary
from routes.auth import token_required
from datetime import datetime

funding_bp = Blueprint('funding', __name__)

@funding_bp.route('/pending-requests', methods=['GET'])
@token_required
def get_pending_requests(current_user):
    """Get all pending funding requests for approval"""
    if current_user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Admin or manager access required'}), 403
    
    try:
        pending_requests = Beneficiary.query.filter_by(
            funding_requested=True,
            funding_status='pending'
        ).all()
        
        requests_data = []
        for beneficiary in pending_requests:
            requests_data.append({
                'beneficiary_id': beneficiary.beneficiary_id,
                'name': beneficiary.name,
                'vulnerability_type': beneficiary.vulnerability_type,
                'county': beneficiary.county,
                'funding_amount': beneficiary.funding_amount,
                'funding_notes': beneficiary.funding_notes,
                'registration_date': beneficiary.registration_date.isoformat() if beneficiary.registration_date else None
            })
        
        return jsonify(requests_data)
        
    except Exception as e:
        print(f"Error retrieving pending requests: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@funding_bp.route('/approve-request', methods=['POST'])
@token_required
def approve_funding_request(current_user):
    """Approve a funding request"""
    if current_user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Admin or manager access required'}), 403
    
    try:
        data = request.get_json()
        beneficiary_id = data.get('beneficiary_id')
        approval_notes = data.get('notes', '')
        
        if not beneficiary_id:
            return jsonify({'error': 'Beneficiary ID is required'}), 400
        
        beneficiary = Beneficiary.query.get(beneficiary_id)
        if not beneficiary:
            return jsonify({'error': f'Beneficiary with ID {beneficiary_id} not found'}), 404
        
        if beneficiary.funding_status != 'pending':
            return jsonify({'error': 'Only pending requests can be approved'}), 400
        
        # Update beneficiary funding status
        beneficiary.funding_status = 'approved'
        beneficiary.funding_approved_date = datetime.now()
        beneficiary.funding_notes = f"Approved by {current_user.full_name}: {approval_notes}"
        
        # Create funding flow record
        funding_flow = FundingFlow(
            program_name=f"Beneficiary Support - {beneficiary.name}",
            allocated_amount=beneficiary.funding_amount,
            disbursed_amount=beneficiary.funding_amount,
            recipient_beneficiary_id=beneficiary.beneficiary_id,
            reported_by=current_user.user_id,
            disbursement_date=datetime.now(),
            notes=f"Approved funding for {beneficiary.name}"
        )
        
        db.session.add(funding_flow)
        db.session.commit()
        
        return jsonify({
            'message': 'Funding request approved successfully',
            'beneficiary_id': beneficiary_id,
            'amount': beneficiary.funding_amount
        })
        
    except Exception as e:
        print(f"Error approving funding request: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@funding_bp.route('/decline-request', methods=['POST'])
@token_required
def decline_funding_request(current_user):
    """Decline a funding request"""
    if current_user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Admin or manager access required'}), 403
    
    try:
        data = request.get_json()
        beneficiary_id = data.get('beneficiary_id')
        decline_notes = data.get('notes', '')
        
        if not beneficiary_id:
            return jsonify({'error': 'Beneficiary ID is required'}), 400
        
        beneficiary = Beneficiary.query.get(beneficiary_id)
        if not beneficiary:
            return jsonify({'error': f'Beneficiary with ID {beneficiary_id} not found'}), 404
        
        if beneficiary.funding_status != 'pending':
            return jsonify({'error': 'Only pending requests can be declined'}), 400
        
        # Update beneficiary funding status
        beneficiary.funding_status = 'declined'
        beneficiary.funding_notes = f"Declined by {current_user.full_name}: {decline_notes}"
        
        db.session.commit()
        
        return jsonify({
            'message': 'Funding request declined successfully',
            'beneficiary_id': beneficiary_id
        })
        
    except Exception as e:
        print(f"Error declining funding request: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@funding_bp.route('/funding-stats', methods=['GET'])
@token_required
def get_funding_stats(current_user):
    """Get comprehensive funding statistics"""
    if current_user.role not in ['admin', 'manager', 'field_agent']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    try:
        # Get all funding statistics
        total_requests = Beneficiary.query.filter_by(funding_requested=True).count()
        approved_requests = Beneficiary.query.filter_by(funding_status='approved').count()
        declined_requests = Beneficiary.query.filter_by(funding_status='declined').count()
        pending_requests = Beneficiary.query.filter_by(funding_status='pending').count()
        
        # Calculate total approved amount
        approved_beneficiaries = Beneficiary.query.filter_by(funding_status='approved').all()
        total_approved_amount = sum(b.funding_amount or 0 for b in approved_beneficiaries)
        
        # Get recent funding flows
        recent_flows = FundingFlow.query.order_by(FundingFlow.disbursement_date.desc()).limit(10).all()
        
        flows_data = []
        for flow in recent_flows:
            flows_data.append({
                'flow_id': flow.flow_id,
                'program_name': flow.program_name,
                'allocated_amount': float(flow.allocated_amount),
                'disbursed_amount': float(flow.disbursed_amount),
                'disbursement_date': flow.disbursement_date.isoformat() if flow.disbursement_date else None,
                'audit_flag': flow.audit_flag
            })
        
        return jsonify({
            'total_requests': total_requests,
            'approved_requests': approved_requests,
            'declined_requests': declined_requests,
            'pending_requests': pending_requests,
            'total_approved_amount': total_approved_amount,
            'recent_flows': flows_data
        })
        
    except Exception as e:
        print(f"Error retrieving funding stats: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@funding_bp.route('/funding', methods=['GET', 'POST'])
@token_required
def handle_funding(current_user):
    if request.method == 'POST':
        if current_user.role not in ['admin', 'manager']:
            return jsonify({'message': 'Insufficient permissions'}), 403
            
        data = request.get_json()
        flow = FundingFlow(
            program_name=data['program_name'],
            allocated_amount=data['allocated_amount'],
            disbursed_amount=data['disbursed_amount'],
            reported_by=current_user.user_id,
            recipient_beneficiary_id=data.get('recipient_id')
        )
        db.session.add(flow)
        db.session.commit()
        return jsonify({'message': 'Funding flow recorded'}), 201
    
    # GET all funding flows (with filters)
    flows = FundingFlow.query.all()
    return jsonify([{
        'id': f.flow_id,
        'program': f.program_name,
        'allocated': float(f.allocated_amount),
        'disbursed': float(f.disbursed_amount),
        'audit_flag': f.audit_flag
    } for f in flows])

@funding_bp.route('/funding/<int:flow_id>/flag', methods=['PUT'])
@token_required
def flag_funding(current_user, flow_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
        
    flow = FundingFlow.query.get_or_404(flow_id)
    flow.audit_flag = not flow.audit_flag
    db.session.commit()
    return jsonify({
        'message': 'Audit flag updated',
        'new_status': flow.audit_flag
    })