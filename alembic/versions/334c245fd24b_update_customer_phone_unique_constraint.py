"""update customer phone unique constraint

Revision ID: 334c245fd24b
Revises: 9fed02fe7cab
Create Date: 2026-08-20 11:14:10.937356

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '334c245fd24b'
down_revision: Union[str, Sequence[str], None] = '9fed02fe7cab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_index('ix_customers_phone', table_name='customers')
    op.create_index(op.f('ix_customers_phone'), 'customers', ['phone'], unique=False)
    op.create_unique_constraint('uq_customer_organization_phone', 'customers', ['organization_id', 'phone'])

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_customer_organization_phone', 'customers', type_='unique')
    op.drop_index(op.f('ix_customers_phone'), table_name='customers')
    op.create_index('ix_customers_phone', 'customers', ['phone'], unique=True)
