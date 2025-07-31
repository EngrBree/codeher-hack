from flask import Blueprint, jsonify
from routes.auth import token_required
from models import db, Beneficiary, VulnerabilityAssessment, User, FundingFlow, DigitalAccess, FinancialRecord
from datetime import datetime, timedelta
from sqlalchemy import func, and_, case

analyst_bp = Blueprint('analyst', __name__)

@analyst_bp.route('/dashboard')
@token_required
def get_dashboard_data(current_user):
    if current_user.role != 'analyst':
        return jsonify({'error': 'Analyst access only'}), 403
    
    try:
        # Get real basic statistics from database
        total_beneficiaries = Beneficiary.query.count()
        total_assessments = VulnerabilityAssessment.query.count()
        high_risk_cases = Beneficiary.query.filter_by(is_high_risk=True).count()
        
        # Calculate real average vulnerability score
        avg_score_result = db.session.query(
            func.avg(
                (VulnerabilityAssessment.poverty_score + 
                 VulnerabilityAssessment.literacy_score + 
                 VulnerabilityAssessment.digital_access_score) / 3.0
            )
        ).scalar()
        avg_vulnerability_score = round(avg_score_result or 0, 2)
        
        # Get real vulnerability distribution
        vulnerability_distribution = db.session.query(
            Beneficiary.vulnerability_type,
            func.count(Beneficiary.beneficiary_id)
        ).group_by(Beneficiary.vulnerability_type).all()
        
        vuln_dist = {}
        for vuln_type, count in vulnerability_distribution:
            vuln_dist[vuln_type] = count
        
        # Get real monthly trends (last 6 months)
        monthly_trends = get_analyst_monthly_trends()
        
        return jsonify({
            'total_beneficiaries': total_beneficiaries,
            'total_assessments': total_assessments,
            'high_risk_cases': high_risk_cases,
            'avg_vulnerability_score': avg_vulnerability_score,
            'vulnerability_distribution': vuln_dist,
            'monthly_trends': monthly_trends
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analyst_bp.route('/charts/real-time')
@token_required
def get_real_time_charts(current_user):
    if current_user.role != 'analyst':
        return jsonify({'error': 'Analyst access only'}), 403
    
    try:
        # Get real vulnerability distribution for charts
        vulnerability_distribution = db.session.query(
            Beneficiary.vulnerability_type,
            func.count(Beneficiary.beneficiary_id)
        ).group_by(Beneficiary.vulnerability_type).all()
        
        vuln_data = {
            'labels': [item[0] for item in vulnerability_distribution],
            'data': [item[1] for item in vulnerability_distribution]
        }
        
        # Get real geographic distribution
        geo_distribution = db.session.query(
            Beneficiary.county,
            func.count(Beneficiary.beneficiary_id)
        ).group_by(Beneficiary.county).order_by(func.count(Beneficiary.beneficiary_id).desc()).limit(10).all()
        
        geo_data = {
            'labels': [item[0] or 'Unknown' for item in geo_distribution],
            'data': [item[1] for item in geo_distribution]
        }
        
        # Get real age distribution
        age_distribution = db.session.query(
            case(
                (Beneficiary.age < 18, '0-18'),
                (Beneficiary.age < 30, '19-30'),
                (Beneficiary.age < 50, '31-50'),
                else_='51+'
            ).label('age_group'),
            func.count(Beneficiary.beneficiary_id)
        ).group_by('age_group').all()
        
        age_data = [0, 0, 0, 0]  # 0-18, 19-30, 31-50, 51+
        for age_group, count in age_distribution:
            if age_group == '0-18':
                age_data[0] = count
            elif age_group == '19-30':
                age_data[1] = count
            elif age_group == '31-50':
                age_data[2] = count
            else:
                age_data[3] = count
        
        # Get real assessment scores
        avg_scores = db.session.query(
            func.avg(VulnerabilityAssessment.poverty_score),
            func.avg(VulnerabilityAssessment.literacy_score),
            func.avg(VulnerabilityAssessment.digital_access_score)
        ).first()
        
        assessment_scores = [
            round(avg_scores[0] or 0, 2),
            round(avg_scores[1] or 0, 2),
            round(avg_scores[2] or 0, 2)
        ]
        
        # Get real monthly trends
        monthly_trends = get_analyst_monthly_trends()
        
        return jsonify({
            'vulnerability_distribution': vuln_data,
            'geographic_distribution': geo_data,
            'age_distribution': age_data,
            'assessment_scores': assessment_scores,
            'monthly_trends': monthly_trends
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_analyst_monthly_trends():
    """Get real monthly trends data for analyst dashboard"""
    trends_data = {'labels': [], 'beneficiaries': [], 'assessments': [], 'vulnerability_scores': []}
    
    for i in range(6):
        date = datetime.now() - timedelta(days=30*i)
        start_of_month = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        
        month_name = start_of_month.strftime('%b')
        trends_data['labels'].insert(0, month_name)
        
        # Count beneficiaries registered in this month
        beneficiaries_count = Beneficiary.query.filter(
            and_(
                Beneficiary.registration_date >= start_of_month,
                Beneficiary.registration_date <= end_of_month
            )
        ).count()
        trends_data['beneficiaries'].insert(0, beneficiaries_count)
        
        # Count assessments in this month
        assessments_count = VulnerabilityAssessment.query.filter(
            and_(
                VulnerabilityAssessment.assessment_date >= start_of_month,
                VulnerabilityAssessment.assessment_date <= end_of_month
            )
        ).count()
        trends_data['assessments'].insert(0, assessments_count)
        
        # Calculate average vulnerability score for this month
        avg_score = db.session.query(
            func.avg(
                (VulnerabilityAssessment.poverty_score + 
                 VulnerabilityAssessment.literacy_score + 
                 VulnerabilityAssessment.digital_access_score) / 3.0
            )
        ).filter(
            and_(
                VulnerabilityAssessment.assessment_date >= start_of_month,
                VulnerabilityAssessment.assessment_date <= end_of_month
            )
        ).scalar()
        
        trends_data['vulnerability_scores'].insert(0, round(avg_score or 0, 2))
    
    return trends_data

@analyst_bp.route('/analytics')
@token_required
def get_analytics(current_user):
    if current_user.role != 'analyst':
        return jsonify({'error': 'Analyst access only'}), 403
    
    try:
        # Geographic distribution
        geo_distribution = db.session.query(
            Beneficiary.location,
            func.count(Beneficiary.beneficiary_id)
        ).group_by(Beneficiary.location).all()
        
        geo_data = {
            'labels': [item[0] or 'Unknown' for item in geo_distribution],
            'data': [item[1] for item in geo_distribution]
        }
        
        # Risk trends (last 6 months)
        risk_trends = {'labels': [], 'data': []}
        for i in range(6):
            date = datetime.now() - timedelta(days=30*i)
            start_of_month = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
            
            month_name = start_of_month.strftime('%b')
            risk_trends['labels'].insert(0, month_name)
            
            # Count high risk cases
            high_risk_count = Beneficiary.query.filter(
                and_(
                    Beneficiary.registration_date >= start_of_month,
                    Beneficiary.registration_date <= end_of_month,
                    Beneficiary.is_high_risk == True
                )
            ).count()
            risk_trends['data'].insert(0, high_risk_count)
        
        # Age distribution
        age_distribution = db.session.query(
            func.case(
                (Beneficiary.age < 18, '0-18'),
                (Beneficiary.age < 30, '19-30'),
                (Beneficiary.age < 50, '31-50'),
                else_='51+'
            ).label('age_group'),
            func.count(Beneficiary.beneficiary_id)
        ).group_by('age_group').all()
        
        age_data = [0, 0, 0, 0]  # 0-18, 19-30, 31-50, 51+
        for age_group, count in age_distribution:
            if age_group == '0-18':
                age_data[0] = count
            elif age_group == '19-30':
                age_data[1] = count
            elif age_group == '31-50':
                age_data[2] = count
            else:
                age_data[3] = count
        
        # Assessment scores
        avg_scores = db.session.query(
            func.avg(VulnerabilityAssessment.poverty_score),
            func.avg(VulnerabilityAssessment.literacy_score),
            func.avg(VulnerabilityAssessment.digital_access_score)
        ).first()
        
        assessment_scores = [
            round(avg_scores[0] or 0, 2),
            round(avg_scores[1] or 0, 2),
            round(avg_scores[2] or 0, 2),
            0,  # Disability (placeholder)
            0   # LGBTQI+ (placeholder)
        ]
        
        return jsonify({
            'geographic_distribution': geo_data,
            'risk_trends': risk_trends,
            'age_distribution': age_data,
            'assessment_scores': assessment_scores
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analyst_bp.route('/trends')
@token_required
def get_trends(current_user):
    if current_user.role != 'analyst':
        return jsonify({'error': 'Analyst access only'}), 403
    
    try:
        # Growth trends (last 12 months)
        growth_trends = {'labels': [], 'data': []}
        for i in range(12):
            date = datetime.now() - timedelta(days=30*i)
            start_of_month = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
            
            month_name = start_of_month.strftime('%b')
            growth_trends['labels'].insert(0, month_name)
            
            # Count new beneficiaries
            new_beneficiaries = Beneficiary.query.filter(
                and_(
                    Beneficiary.registration_date >= start_of_month,
                    Beneficiary.registration_date <= end_of_month
                )
            ).count()
            growth_trends['data'].insert(0, new_beneficiaries)
        
        # Vulnerability score trends
        vuln_trends = {'labels': [], 'data': []}
        for i in range(6):
            date = datetime.now() - timedelta(days=30*i)
            start_of_month = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
            
            month_name = start_of_month.strftime('%b')
            vuln_trends['labels'].insert(0, month_name)
            
            # Calculate average vulnerability score for this month
            avg_score = db.session.query(
                func.avg(
                    (VulnerabilityAssessment.poverty_score + 
                     VulnerabilityAssessment.literacy_score + 
                     VulnerabilityAssessment.digital_access_score) / 3.0
                )
            ).filter(
                and_(
                    VulnerabilityAssessment.assessment_date >= start_of_month,
                    VulnerabilityAssessment.assessment_date <= end_of_month
                )
            ).scalar()
            
            vuln_trends['data'].insert(0, round(avg_score or 0, 2))
        
        return jsonify({
            'growth': growth_trends,
            'vulnerability': vuln_trends
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analyst_bp.route('/report/comprehensive', methods=['POST'])
@token_required
def generate_comprehensive_report(current_user):
    if current_user.role != 'analyst':
        return jsonify({'error': 'Analyst access only'}), 403
    
    try:
        # Get comprehensive report data
        total_beneficiaries = Beneficiary.query.count()
        total_assessments = VulnerabilityAssessment.query.count()
        high_risk_cases = Beneficiary.query.filter_by(is_high_risk=True).count()
        
        # Calculate average vulnerability score
        avg_score_result = db.session.query(
            func.avg(
                (VulnerabilityAssessment.poverty_score + 
                 VulnerabilityAssessment.literacy_score + 
                 VulnerabilityAssessment.digital_access_score) / 3.0
            )
        ).scalar()
        avg_vulnerability_score = round(avg_score_result or 0, 2)
        
        # Generate insights
        insights = [
            f"Total of {total_beneficiaries} beneficiaries registered in the system",
            f"Average vulnerability score is {avg_vulnerability_score}/5",
            f"{high_risk_cases} beneficiaries identified as high-risk cases",
            f"{total_assessments} vulnerability assessments completed"
        ]
        
        return jsonify({
            'total_beneficiaries': total_beneficiaries,
            'total_assessments': total_assessments,
            'high_risk_cases': high_risk_cases,
            'avg_vulnerability_score': avg_vulnerability_score,
            'insights': insights,
            'generated_at': datetime.now().isoformat(),
            'analyst': current_user.full_name
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analyst_bp.route('/export')
@token_required
def export_data(current_user):
    if current_user.role != 'analyst':
        return jsonify({'error': 'Analyst access only'}), 403
    
    try:
        # Get all beneficiaries with their assessments
        beneficiaries = Beneficiary.query.all()
        
        # Create CSV content
        csv_content = "Name,Vulnerability Type,Age,Location,Contact Info,High Risk,Registration Date\n"
        
        for beneficiary in beneficiaries:
            csv_content += f'"{beneficiary.name}","{beneficiary.vulnerability_type}",{beneficiary.age or ""},"{beneficiary.location or ""}","{beneficiary.contact_info or ""}","{beneficiary.is_high_risk}","{beneficiary.registration_date}"\n'
        
        # Add assessments data
        csv_content += "\n\nAssessments Data\n"
        csv_content += "Beneficiary,Assessment Date,Poverty Score,Literacy Score,Digital Score,Disability,LGBTQI+,Refugee\n"
        
        assessments = VulnerabilityAssessment.query.all()
        for assessment in assessments:
            csv_content += f'"{assessment.beneficiary.name}","{assessment.assessment_date}","{assessment.poverty_score}","{assessment.literacy_score}","{assessment.digital_access_score}","{assessment.disability_status}","{assessment.lgbtqi_status}","{assessment.refugee_status}"\n'
        
        from flask import Response
        return Response(
            csv_content,
            mimetype='text/csv',
            headers={'Content-Disposition': 'attachment; filename=heva_data_export.csv'}
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analyst_bp.route('/analysis', methods=['POST'])
@token_required
def create_analysis(current_user):
    if current_user.role != 'analyst':
        return jsonify({'error': 'Analyst access only'}), 403
    
    try:
        from flask import request
        data = request.get_json()
        
        analysis_type = data.get('analysis_type')
        date_range = int(data.get('date_range', 30))
        filters = data.get('filters', '')
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=date_range)
        
        # Perform analysis based on type
        if analysis_type == 'vulnerability':
            result = perform_vulnerability_analysis(start_date, end_date)
        elif analysis_type == 'geographic':
            result = perform_geographic_analysis(start_date, end_date)
        elif analysis_type == 'trend':
            result = perform_trend_analysis(start_date, end_date)
        elif analysis_type == 'risk':
            result = perform_risk_analysis(start_date, end_date)
        else:
            return jsonify({'error': 'Invalid analysis type'}), 400
        
        return jsonify({
            'analysis_type': analysis_type,
            'date_range': f'Last {date_range} days',
            'filters': filters,
            'results': result,
            'created_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def perform_vulnerability_analysis(start_date, end_date):
    """Perform vulnerability analysis for the given date range"""
    assessments = VulnerabilityAssessment.query.filter(
        and_(
            VulnerabilityAssessment.assessment_date >= start_date,
            VulnerabilityAssessment.assessment_date <= end_date
        )
    ).all()
    
    total_assessments = len(assessments)
    if total_assessments == 0:
        return {'message': 'No assessments found in the specified date range'}
    
    avg_poverty = sum(a.poverty_score for a in assessments) / total_assessments
    avg_literacy = sum(a.literacy_score for a in assessments) / total_assessments
    avg_digital = sum(a.digital_access_score for a in assessments) / total_assessments
    
    return {
        'total_assessments': total_assessments,
        'average_scores': {
            'poverty': round(avg_poverty, 2),
            'literacy': round(avg_literacy, 2),
            'digital_access': round(avg_digital, 2)
        },
        'high_risk_percentage': round(sum(1 for a in assessments if a.poverty_score >= 4) / total_assessments * 100, 2)
    }

def perform_geographic_analysis(start_date, end_date):
    """Perform geographic analysis for the given date range"""
    beneficiaries = Beneficiary.query.filter(
        and_(
            Beneficiary.registration_date >= start_date,
            Beneficiary.registration_date <= end_date
        )
    ).all()
    
    location_counts = {}
    for beneficiary in beneficiaries:
        location = beneficiary.location or 'Unknown'
        location_counts[location] = location_counts.get(location, 0) + 1
    
    return {
        'total_beneficiaries': len(beneficiaries),
        'location_distribution': location_counts,
        'most_common_location': max(location_counts.items(), key=lambda x: x[1])[0] if location_counts else 'None'
    }

def perform_trend_analysis(start_date, end_date):
    """Perform trend analysis for the given date range"""
    # Get daily counts for the period
    daily_data = {}
    current_date = start_date
    while current_date <= end_date:
        count = Beneficiary.query.filter(
            Beneficiary.registration_date == current_date.date()
        ).count()
        daily_data[current_date.strftime('%Y-%m-%d')] = count
        current_date += timedelta(days=1)
    
    return {
        'period': f'{start_date.strftime("%Y-%m-%d")} to {end_date.strftime("%Y-%m-%d")}',
        'total_new_beneficiaries': sum(daily_data.values()),
        'daily_trends': daily_data,
        'average_daily_registrations': round(sum(daily_data.values()) / len(daily_data), 2)
    }

def perform_risk_analysis(start_date, end_date):
    """Perform risk analysis for the given date range"""
    high_risk_beneficiaries = Beneficiary.query.filter(
        and_(
            Beneficiary.registration_date >= start_date,
            Beneficiary.registration_date <= end_date,
            Beneficiary.is_high_risk == True
        )
    ).all()
    
    total_beneficiaries = Beneficiary.query.filter(
        and_(
            Beneficiary.registration_date >= start_date,
            Beneficiary.registration_date <= end_date
        )
    ).count()
    
    return {
        'total_beneficiaries': total_beneficiaries,
        'high_risk_count': len(high_risk_beneficiaries),
        'high_risk_percentage': round(len(high_risk_beneficiaries) / total_beneficiaries * 100, 2) if total_beneficiaries > 0 else 0,
        'vulnerability_types': {
            beneficiary.vulnerability_type: sum(1 for b in high_risk_beneficiaries if b.vulnerability_type == beneficiary.vulnerability_type)
            for beneficiary in high_risk_beneficiaries
        }
    } 