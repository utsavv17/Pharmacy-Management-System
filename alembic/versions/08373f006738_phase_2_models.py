"""phase_2_models

Revision ID: 08373f006738
Revises: dda8aa69b631
Create Date: 2026-08-19 13:16:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '08373f006738'
down_revision = 'dda8aa69b631'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Create customers
    op.create_table(
        'customers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('total_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_purchase_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_orders', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('phone')
    )
    op.create_index(op.f('ix_customers_id'), 'customers', ['id'], unique=False)
    op.create_index(op.f('ix_customers_name'), 'customers', ['name'], unique=False)
    op.create_index(op.f('ix_customers_phone'), 'customers', ['phone'], unique=False)

    # 2. Add columns to sales
    op.add_column('sales', sa.Column('customer_id', sa.Integer(), nullable=True))
    op.add_column('sales', sa.Column('points_earned', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('sales', sa.Column('points_redeemed', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('sales', sa.Column('status', sa.String(), nullable=False, server_default='COMPLETED'))
    op.create_index(op.f('ix_sales_customer_id'), 'sales', ['customer_id'], unique=False)
    op.create_foreign_key(None, 'sales', 'customers', ['customer_id'], ['id'])

    # 3. Create sale_returns
    op.create_table(
        'sale_returns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sale_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=True),
        sa.Column('refund_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('reason', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='COMPLETED'),
        sa.Column('processed_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.ForeignKeyConstraint(['processed_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sale_returns_customer_id'), 'sale_returns', ['customer_id'], unique=False)
    op.create_index(op.f('ix_sale_returns_id'), 'sale_returns', ['id'], unique=False)
    op.create_index(op.f('ix_sale_returns_sale_id'), 'sale_returns', ['sale_id'], unique=False)

    # 4. Create sale_return_items
    op.create_table(
        'sale_return_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('return_id', sa.Integer(), nullable=False),
        sa.Column('sale_item_id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('refund_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ),
        sa.ForeignKeyConstraint(['return_id'], ['sale_returns.id'], ),
        sa.ForeignKeyConstraint(['sale_item_id'], ['sale_items.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sale_return_items_id'), 'sale_return_items', ['id'], unique=False)
    op.create_index(op.f('ix_sale_return_items_return_id'), 'sale_return_items', ['return_id'], unique=False)
    op.create_index(op.f('ix_sale_return_items_sale_item_id'), 'sale_return_items', ['sale_item_id'], unique=False)

    # 5. Create reward_transactions
    op.create_table(
        'reward_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('sale_id', sa.Integer(), nullable=True),
        sa.Column('return_id', sa.Integer(), nullable=True),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.ForeignKeyConstraint(['return_id'], ['sale_returns.id'], ),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reward_transactions_customer_id'), 'reward_transactions', ['customer_id'], unique=False)
    op.create_index(op.f('ix_reward_transactions_id'), 'reward_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_reward_transactions_return_id'), 'reward_transactions', ['return_id'], unique=False)
    op.create_index(op.f('ix_reward_transactions_sale_id'), 'reward_transactions', ['sale_id'], unique=False)

    # 6. Add columns to settings
    op.add_column('settings', sa.Column('currency_units_per_point', sa.Integer(), nullable=False, server_default='100'))
    op.add_column('settings', sa.Column('minimum_redemption_points', sa.Integer(), nullable=False, server_default='100'))
    op.add_column('settings', sa.Column('point_value', sa.Float(), nullable=False, server_default='0.1'))
    op.add_column('settings', sa.Column('maximum_points_per_sale', sa.Integer(), nullable=False, server_default='1000'))


def downgrade() -> None:
    # 1. Drop columns from settings
    op.drop_column('settings', 'maximum_points_per_sale')
    op.drop_column('settings', 'point_value')
    op.drop_column('settings', 'minimum_redemption_points')
    op.drop_column('settings', 'currency_units_per_point')

    # 2. Drop reward_transactions
    op.drop_table('reward_transactions')

    # 3. Drop sale_return_items
    op.drop_table('sale_return_items')

    # 4. Drop sale_returns
    op.drop_table('sale_returns')

    # 5. Drop columns from sales
    op.drop_constraint(None, 'sales', type_='foreignkey')
    op.drop_index(op.f('ix_sales_customer_id'), table_name='sales')
    op.drop_column('sales', 'status')
    op.drop_column('sales', 'points_redeemed')
    op.drop_column('sales', 'points_earned')
    op.drop_column('sales', 'customer_id')

    # 6. Drop customers
    op.drop_table('customers')
