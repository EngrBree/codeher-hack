"""Add county fields to beneficiaries table

Revision ID: add_county_fields
Revises: adec844e054b
Create Date: 2024-01-30 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_county_fields'
down_revision = 'adec844e054b'
branch_labels = None
depends_on = None


def upgrade():
    # Add county fields to beneficiaries table
    op.add_column('beneficiaries', sa.Column('county', sa.String(100), nullable=True))
    op.add_column('beneficiaries', sa.Column('county_code', sa.String(10), nullable=True))


def downgrade():
    # Remove county fields from beneficiaries table
    op.drop_column('beneficiaries', 'county')
    op.drop_column('beneficiaries', 'county_code') 