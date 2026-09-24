"""Add payment_method to sales

Revision ID: f6607ec5e2f7
Revises: d0874e83c6a2
Create Date: 2026-09-23 21:58:44.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6607ec5e2f7'
down_revision: Union[str, Sequence[str], None] = 'd0874e83c6a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('sales', sa.Column('payment_method', sa.String(), nullable=False, server_default='CASH'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('sales', 'payment_method')
