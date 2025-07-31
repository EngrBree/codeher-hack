"""
PDF Generator for HEVA System
Generates various reports and documents in PDF format
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime
import os

class PDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkblue
        )
        
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6
        )
    
    def generate_beneficiary_report(self, beneficiaries_data, report_type="comprehensive"):
        """Generate beneficiary report PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Title
        title = Paragraph(f"HEVA Beneficiary Report - {report_type.title()}", self.title_style)
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Report metadata
        metadata = [
            ["Report Type:", report_type.title()],
            ["Generated On:", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
            ["Total Beneficiaries:", str(len(beneficiaries_data))],
        ]
        
        meta_table = Table(metadata, colWidths=[2*inch, 4*inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 20))
        
        # Beneficiary details table
        if beneficiaries_data:
            headers = ["Name", "Age", "Gender", "Vulnerability", "Location", "Status"]
            data = [headers]
            
            for beneficiary in beneficiaries_data:
                data.append([
                    beneficiary.get('name', 'N/A'),
                    str(beneficiary.get('age', 'N/A')),
                    beneficiary.get('gender', 'N/A'),
                    beneficiary.get('vulnerability_type', 'N/A'),
                    beneficiary.get('location', 'N/A'),
                    beneficiary.get('funding_status', 'N/A')
                ])
            
            table = Table(data, colWidths=[1.2*inch, 0.6*inch, 0.6*inch, 1.2*inch, 1.2*inch, 1*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]))
            story.append(table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def generate_funding_report(self, funding_data):
        """Generate funding report PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Title
        title = Paragraph("HEVA Funding Report", self.title_style)
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Summary statistics
        total_allocated = sum(item.get('allocated_amount', 0) for item in funding_data)
        total_disbursed = sum(item.get('disbursed_amount', 0) for item in funding_data)
        
        summary_data = [
            ["Metric", "Amount (KES)"],
            ["Total Allocated", f"{total_allocated:,.2f}"],
            ["Total Disbursed", f"{total_disbursed:,.2f}"],
            ["Utilization Rate", f"{(total_disbursed/total_allocated*100):.1f}%" if total_allocated > 0 else "0%"],
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # Funding details table
        if funding_data:
            headers = ["Program", "Allocated", "Disbursed", "Date", "Status"]
            data = [headers]
            
            for item in funding_data:
                data.append([
                    item.get('program_name', 'N/A'),
                    f"{item.get('allocated_amount', 0):,.2f}",
                    f"{item.get('disbursed_amount', 0):,.2f}",
                    item.get('disbursement_date', 'N/A'),
                    "Completed" if item.get('disbursed_amount', 0) > 0 else "Pending"
                ])
            
            table = Table(data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch, 1*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def generate_dashboard_report(self, dashboard_data, user_role):
        """Generate dashboard summary report PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Title
        title = Paragraph(f"HEVA {user_role.title()} Dashboard Report", self.title_style)
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Key metrics
        metrics_heading = Paragraph("Key Performance Indicators", self.heading_style)
        story.append(metrics_heading)
        
        metrics_data = [
            ["Metric", "Value", "Change"],
            ["Total Beneficiaries", str(dashboard_data.get('total_beneficiaries', 0)), "+12%"],
            ["Active Programs", str(dashboard_data.get('active_programs', 0)), "+3%"],
            ["Fund Utilization", f"{dashboard_data.get('fund_utilization', 0)}%", "+8%"],
            ["System Health", f"{dashboard_data.get('system_health', 100)}%", "+2%"],
        ]
        
        metrics_table = Table(metrics_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(metrics_table)
        story.append(Spacer(1, 20))
        
        # Recent activity
        if dashboard_data.get('recent_activity'):
            activity_heading = Paragraph("Recent Activity", self.heading_style)
            story.append(activity_heading)
            
            activity_data = [["Activity", "Date", "User"]]
            for activity in dashboard_data['recent_activity'][:10]:  # Limit to 10 items
                activity_data.append([
                    activity.get('description', 'N/A'),
                    activity.get('date', 'N/A'),
                    activity.get('user', 'N/A')
                ])
            
            activity_table = Table(activity_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
            activity_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(activity_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer
