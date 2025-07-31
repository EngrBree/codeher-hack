# Real-Time Dashboard Features

## Overview

The HEVA system now features real-time dashboards for Admin, Manager, and Analyst roles with live data insights from the database. All charts and statistics are updated automatically with real data from the system.

## Features Implemented

### 1. Real-Time Data APIs

#### Admin Dashboard (`/api/admin/charts/real-time`)
- **Vulnerability Distribution**: Real-time breakdown of beneficiaries by vulnerability type
- **Gender Distribution**: Live gender demographics
- **Funding Status**: Current funding approval/decline/pending statistics
- **Regional Distribution**: County-wise beneficiary distribution
- **Monthly Trends**: 6-month historical trends for beneficiaries and funding

#### Manager Dashboard (`/api/manager/charts/real-time`)
- **Program Performance**: Real-time performance metrics by vulnerability type
- **County Distribution**: Geographic spread of beneficiaries
- **Funding Distribution**: Live funding status breakdown
- **Monthly Trends**: Strategic trends over time

#### Analyst Dashboard (`/api/analyst/charts/real-time`)
- **Vulnerability Distribution**: Detailed vulnerability type analysis
- **Geographic Distribution**: County-wise beneficiary analysis
- **Age Distribution**: Age group demographics
- **Assessment Scores**: Average vulnerability assessment scores
- **Monthly Trends**: Multi-metric trends including beneficiaries, assessments, and vulnerability scores

### 2. Real-Time Statistics

#### Admin Statistics
- Total Users (live count)
- Total Beneficiaries (live count)
- Active Users (live count)
- System Health (calculated from real metrics)

#### Manager Statistics
- Total Beneficiaries (live count)
- Active Programs (calculated from vulnerability types and funding programs)
- Fund Utilization (calculated from allocated vs disbursed amounts)
- Impact Score (calculated from funding, digital access, and financial inclusion metrics)

#### Analyst Statistics
- Total Beneficiaries (live count)
- Total Assessments (live count)
- High Risk Cases (live count)
- Average Vulnerability Score (calculated from assessment data)

### 3. Automatic Updates

- **Admin Dashboard**: Updates every 30 seconds
- **Manager Dashboard**: Updates every 45 seconds
- **Analyst Dashboard**: Updates every 60 seconds

All charts and statistics refresh automatically without page reload.

### 4. Database-Driven Insights

#### Real Calculations
- **System Health**: Based on user activity ratios and data volume
- **Fund Utilization**: Calculated from actual allocated vs disbursed amounts
- **Impact Score**: Weighted calculation from funding approvals, digital access, and financial inclusion
- **Program Performance**: Normalized scores based on beneficiary counts per vulnerability type

#### Strategic Insights
- **Funding Success Rate**: Real percentage of approved funding requests
- **High Risk Analysis**: Percentage of beneficiaries identified as high-risk
- **Geographic Coverage**: County-wise distribution analysis
- **Trend Analysis**: Historical data patterns over 6 months

## Data Sources

### Primary Tables
- `beneficiaries`: Core beneficiary information
- `vulnerability_assessments`: Assessment scores and metrics
- `funding_flows`: Funding allocation and disbursement data
- `digital_access`: Digital inclusion metrics
- `financial_records`: Financial inclusion data
- `users`: User management and activity

### Real-Time Queries
All dashboard data is fetched using optimized SQL queries with:
- Proper indexing on frequently queried fields
- Efficient aggregations using SQLAlchemy functions
- Real-time calculations without caching delays

## Setup Instructions

### 1. Run Sample Data Script
```bash
cd codeher-hack
python create_sample_data.py
```

This will populate the database with 50 sample beneficiaries and related data.

### 2. Access Dashboards
Use the predefined login credentials:

- **Admin**: `admin@heva` / `SecureAdmin123!`
- **Manager**: `manager@heva` / `ManagerPass456!`
- **Analyst**: `analyst@heva` / `AnalystAccess789!`

### 3. View Real-Time Data
- Navigate to respective dashboards
- Charts will automatically load with real data
- Statistics will update in real-time
- No manual refresh required

## Technical Implementation

### Backend (Flask/SQLAlchemy)
- New API endpoints for real-time data
- Optimized database queries
- Real-time calculations and aggregations
- Proper error handling and fallbacks

### Frontend (JavaScript/Chart.js)
- Automatic data fetching
- Real-time chart updates
- Responsive design
- Error handling and user feedback

### Database
- Efficient indexing on key fields
- Optimized query patterns
- Real-time data access
- Proper relationships and constraints

## Performance Considerations

### Optimization Features
- Efficient SQL queries with proper indexing
- Minimal data transfer (only necessary fields)
- Client-side chart updates (no full page reloads)
- Configurable update intervals

### Scalability
- Database queries optimized for large datasets
- Modular API design for easy scaling
- Efficient data aggregation patterns
- Proper error handling for high-load scenarios

## Future Enhancements

### Planned Features
- Real-time notifications for data changes
- Customizable dashboard layouts
- Export functionality for charts
- Advanced filtering and drill-down capabilities
- Real-time collaboration features

### Performance Improvements
- Database query optimization
- Caching strategies for frequently accessed data
- WebSocket implementation for instant updates
- Advanced analytics and machine learning insights

## Troubleshooting

### Common Issues
1. **Charts not loading**: Check browser console for JavaScript errors
2. **Data not updating**: Verify API endpoints are accessible
3. **Performance issues**: Check database connection and query performance
4. **Authentication errors**: Ensure proper token handling

### Debug Mode
Enable debug logging by setting environment variable:
```bash
export FLASK_DEBUG=1
```

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team. 