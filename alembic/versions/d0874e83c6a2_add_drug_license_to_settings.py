"""Add drug_license to settings

Revision ID: d0874e83c6a2
Revises: 5679b57ed1a8
Create Date: 2026-09-23 14:04:25.405352

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd0874e83c6a2'
down_revision: Union[str, Sequence[str], None] = '5679b57ed1a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('settings', sa.Column('drug_license', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('settings', 'drug_license')
