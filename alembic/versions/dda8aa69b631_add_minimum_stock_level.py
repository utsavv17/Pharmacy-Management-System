"""Add minimum_stock_level

Revision ID: dda8aa69b631
Revises: 1acb856fbaa6
Create Date: 2026-08-19 12:56:52.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'dda8aa69b631'
down_revision = '1acb856fbaa6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # We use server_default to ensure existing rows get 20
    op.add_column('medicines', sa.Column('minimum_stock_level', sa.Integer(), server_default='20', nullable=False))


def downgrade() -> None:
    op.drop_column('medicines', 'minimum_stock_level')
