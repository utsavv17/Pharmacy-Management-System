import sys
import os
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

# Ensure 'app' module can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
import app.db.base # To load all mappers
from app.models.plan import Plan
from app.models.organization import Organization
from app.models.user import User
from app.models.settings import Settings
from app.models.supplier import Supplier
from app.models.medicine import Medicine
from app.models.batch import Batch
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.reward_transaction import RewardTransaction
from app.models.sale_return import SaleReturn
from app.models.purchase import Purchase
from app.core.security import hash_password
from app.schemas.customer import CustomerCreate
from app.services.customer_service import CustomerService
from app.schemas.purchase import PurchaseCreate, PurchaseItemCreate
from app.services.purchase_service import PurchaseService
from app.schemas.sale import SaleCreate, SaleItemCreate
from app.services.sale_service import SaleService
from app.schemas.returns import SaleReturnCreate, SaleReturnItemCreate
from app.services.return_service import ReturnService


def get_or_create_plan(db: Session, name: str, price: float, users: int) -> Plan:
    plan = db.query(Plan).filter(Plan.name == name).first()
    if not plan:
        plan = Plan(
            name=name,
            price=price,
            billing_cycle="MONTHLY",
            max_users=users,
            max_products=10000,
            max_monthly_transactions=10000,
            is_active=True
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)
    return plan


def get_or_create_org(db: Session, name: str, legal: str, owner: str, email: str, phone: str, status: str, plan_id: int) -> Organization:
    org = db.query(Organization).filter(Organization.email == email).first()
    if not org:
        org = Organization(
            name=name,
            legal_name=legal,
            owner_name=owner,
            email=email,
            phone=phone,
            status=status,
            plan_id=plan_id
        )
        db.add(org)
        db.commit()
        db.refresh(org)
    return org


def get_or_create_user(db: Session, email: str, role: str, org_id: int = None) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password("Test@12345"),
            role=role,
            is_active=1,
            organization_id=org_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_or_create_settings(db: Session, org_id: int, name: str, phone: str, email: str, address: str):
    s = db.query(Settings).filter(Settings.organization_id == org_id).first()
    if not s:
        s = Settings(
            organization_id=org_id,
            pharmacy_name=name,
            address=address,
            phone=phone,
            email=email
        )
        db.add(s)
        db.commit()


def get_or_create_supplier(db: Session, name: str, phone: str, email: str, org_id: int) -> Supplier:
    sup = db.query(Supplier).filter(Supplier.name == name, Supplier.organization_id == org_id).first()
    if not sup:
        sup = Supplier(
            name=name,
            company_name=name + " Ltd",
            phone=phone,
            email=email,
            address="Some Address",
            organization_id=org_id
        )
        db.add(sup)
        db.commit()
        db.refresh(sup)
    return sup


def get_or_create_medicine(db: Session, name: str, min_stock: int, sp: float, org_id: int) -> Medicine:
    m = db.query(Medicine).filter(Medicine.name == name, Medicine.organization_id == org_id).first()
    if not m:
        m = Medicine(
            name=name,
            generic_name=name,
            brand="Generic Pharma",
            category="Tablet",
            strength="500mg",
            unit="Strip",
            minimum_stock_level=min_stock,
            organization_id=org_id
        )
        db.add(m)
        db.commit()
        db.refresh(m)
    return m


def main():
    db = SessionLocal()
    try:
        print("Starting Database Seeding...")

        # ---------------------------------------------------------
        # 1. PLANS
        # ---------------------------------------------------------
        basic_plan = get_or_create_plan(db, "Basic", 999.0, 3)
        pro_plan = get_or_create_plan(db, "Professional", 2499.0, 10)
        ent_plan = get_or_create_plan(db, "Enterprise", 4999.0, 50)

        # ---------------------------------------------------------
        # 2. ORGANIZATIONS
        # ---------------------------------------------------------
        central_org = get_or_create_org(db, "My Medical - Central Pharmacy", "My Medical Central Healthcare Pvt Ltd", "Owner Central", "central@mymedical.test", "+919000000001", "ACTIVE", pro_plan.id)
        city_org = get_or_create_org(db, "My Medical - City Care", "City Care Medicals Pvt Ltd", "Owner City", "citycare@mymedical.test", "+919000000002", "ACTIVE", basic_plan.id)
        test_org = get_or_create_org(db, "My Medical - Test Pharmacy", "My Medical Test Pharmacy", "Owner Test", "test@mymedical.test", "+919000000003", "SUSPENDED", basic_plan.id)

        # ---------------------------------------------------------
        # 3. SETTINGS
        # ---------------------------------------------------------
        get_or_create_settings(db, central_org.id, "My Medical - Central Pharmacy", "+919000000001", "central@mymedical.test", "123 Main Road, Pune, Maharashtra")
        get_or_create_settings(db, city_org.id, "My Medical - City Care", "+919000000002", "citycare@mymedical.test", "456 Market Road, Pune, Maharashtra")

        # ---------------------------------------------------------
        # 4. USERS
        # ---------------------------------------------------------
        get_or_create_user(db, "superadmin@mymedical.test", "super_admin", None)
        get_or_create_user(db, "owner.central@mymedical.test", "owner", central_org.id)
        get_or_create_user(db, "staff.central@mymedical.test", "staff", central_org.id)
        get_or_create_user(db, "cashier.central@mymedical.test", "staff", central_org.id)
        get_or_create_user(db, "owner.citycare@mymedical.test", "owner", city_org.id)
        get_or_create_user(db, "staff.citycare@mymedical.test", "staff", city_org.id)
        get_or_create_user(db, "owner.test@mymedical.test", "owner", test_org.id)

        # ---------------------------------------------------------
        # 5. SUPPLIERS
        # ---------------------------------------------------------
        c_sup1 = get_or_create_supplier(db, "Sunrise Pharma Distributors", "9000100001", "sunrise@dist.com", central_org.id)
        c_sup2 = get_or_create_supplier(db, "Medico Wholesale Pvt Ltd", "9000100002", "medico@dist.com", central_org.id)
        c_sup3 = get_or_create_supplier(db, "HealthFirst Distributors", "9000100003", "health@dist.com", central_org.id)
        get_or_create_supplier(db, "Apollo Medical Supply", "9000100004", "apollo@dist.com", central_org.id)
        get_or_create_supplier(db, "Prime Healthcare Distributors", "9000100005", "prime@dist.com", central_org.id)
        
        city_sup1 = get_or_create_supplier(db, "City Suppliers", "9000200001", "citysup@dist.com", city_org.id)

        # ---------------------------------------------------------
        # 6. MEDICINES
        # ---------------------------------------------------------
        central_meds_data = [
            ("Paracetamol", 20, 10.0), ("Ibuprofen", 10, 15.0), ("Azithromycin", 30, 50.0), ("Amoxicillin", 10, 40.0),
            ("Cetirizine", 15, 8.0), ("Pantoprazole", 50, 60.0), ("Omeprazole", 20, 55.0), ("Metformin", 100, 20.0),
            ("Amlodipine", 20, 25.0), ("Atorvastatin", 10, 45.0), ("ORS", 50, 5.0), ("Vitamin D3", 5, 80.0),
            ("Calcium", 10, 30.0), ("Multivitamin", 10, 40.0), ("Cough Syrup", 20, 90.0), ("Antacid", 15, 60.0),
            ("Diclofenac", 10, 12.0), ("Levocetirizine", 10, 10.0), ("Montelukast", 10, 25.0), ("Glimepiride", 20, 18.0)
        ]
        c_meds = []
        for name, min_st, sp in central_meds_data:
            c_meds.append(get_or_create_medicine(db, name, min_st, sp, central_org.id))

        city_meds_data = [
            ("Paracetamol 650", 15, 12.0), ("Cough Syrup City", 5, 95.0), ("Vitamin C", 10, 20.0),
            ("ORS Apple", 10, 10.0), ("Ibuprofen City", 20, 14.0), ("Calcium City", 10, 35.0),
            ("B-Complex", 15, 25.0), ("Zinc", 10, 40.0)
        ]
        get_or_create_medicine(db, "Paracetamol", 15, 12.0, city_org.id) # Cross-tenant test
        for name, min_st, sp in city_meds_data:
            get_or_create_medicine(db, name, min_st, sp, city_org.id)

        # ---------------------------------------------------------
        # 7. PURCHASES & INVENTORY (FEFO logic test)
        # ---------------------------------------------------------
        if db.query(Purchase).filter(Purchase.organization_id == central_org.id).count() == 0:
            print("Creating Central Purchases...")
            
            # Purchase 1 - Paracetamol Normal & Expired
            p1_items = [
                PurchaseItemCreate(medicine_id=c_meds[0].id, batch_no="PCM-NOR-001", expiry_date=date.today() + timedelta(days=365), purchase_price=5.0, selling_price=10.0, quantity=100),
                PurchaseItemCreate(medicine_id=c_meds[0].id, batch_no="PCM-EXP-001", expiry_date=date.today() - timedelta(days=10), purchase_price=5.0, selling_price=10.0, quantity=10),
                PurchaseItemCreate(medicine_id=c_meds[1].id, batch_no="IBU-LOW-001", expiry_date=date.today() + timedelta(days=365), purchase_price=8.0, selling_price=15.0, quantity=5) # Low stock
            ]
            PurchaseService.create_purchase(db, PurchaseCreate(invoice_number="INV-001", supplier_id=c_sup1.id, purchase_date=date.today(), items=p1_items), central_org.id)

            # Purchase 2 - Azithromycin Near Expiry & Normal FEFO tests
            p2_items = [
                PurchaseItemCreate(medicine_id=c_meds[2].id, batch_no="AZI-FEFO-001", expiry_date=date.today() + timedelta(days=10), purchase_price=30.0, selling_price=50.0, quantity=20),
                PurchaseItemCreate(medicine_id=c_meds[2].id, batch_no="AZI-FEFO-002", expiry_date=date.today() + timedelta(days=100), purchase_price=30.0, selling_price=50.0, quantity=50),
                PurchaseItemCreate(medicine_id=c_meds[3].id, batch_no="AMX-NOR-001", expiry_date=date.today() + timedelta(days=200), purchase_price=25.0, selling_price=40.0, quantity=100)
            ]
            PurchaseService.create_purchase(db, PurchaseCreate(invoice_number="INV-002", supplier_id=c_sup2.id, purchase_date=date.today(), items=p2_items), central_org.id)

            # Purchase 3 - City Care isolated
            city_med = db.query(Medicine).filter(Medicine.organization_id == city_org.id).first()
            p3_items = [
                PurchaseItemCreate(medicine_id=city_med.id, batch_no="CITY-PCM-001", expiry_date=date.today() + timedelta(days=300), purchase_price=5.0, selling_price=12.0, quantity=50)
            ]
            PurchaseService.create_purchase(db, PurchaseCreate(invoice_number="CITY-INV-001", supplier_id=city_sup1.id, purchase_date=date.today(), items=p3_items), city_org.id)

        # ---------------------------------------------------------
        # 8. CUSTOMERS
        # ---------------------------------------------------------
        central_customers_names = ["Aarav Sharma", "Riya Patel", "Rahul Verma", "Priya Singh", "Amit Joshi", "Neha Kulkarni", "Vikram Mehta", "Sneha Shah", "Rohan Gupta", "Ananya Deshmukh"]
        c_custs = []
        for i, name in enumerate(central_customers_names):
            phone = f"98000000{i:02d}"
            c = db.query(Customer).filter(Customer.phone == phone, Customer.organization_id == central_org.id).first()
            if not c:
                c = CustomerService.create_customer(db, CustomerCreate(name=name, phone=phone, email=f"cust{i}@test.com", address="Pune"), central_org.id)
            c_custs.append(c)

        city_c = db.query(Customer).filter(Customer.phone == "9900000000", Customer.organization_id == city_org.id).first()
        if not city_c:
            CustomerService.create_customer(db, CustomerCreate(name="Aarav Sharma", phone="9900000000", email="citycust@test.com", address="Pune"), city_org.id)

        # ---------------------------------------------------------
        # 9. SALES & RETURNS
        # ---------------------------------------------------------
        if db.query(Sale).filter(Sale.organization_id == central_org.id).count() == 0:
            print("Creating Central Sales...")
            
            # Sale 1: Walk-in Sale
            s1_items = [SaleItemCreate(medicine_id=c_meds[0].id, quantity=2)]
            SaleService.create_sale(db, SaleCreate(invoice_number="SALE-001", sale_date=date.today(), items=s1_items), central_org.id)
            
            # Sale 2: Customer Sale (Earns Points)
            s2_items = [SaleItemCreate(medicine_id=c_meds[0].id, quantity=10)]
            SaleService.create_sale(db, SaleCreate(invoice_number="SALE-002", customer_id=c_custs[0].id, sale_date=date.today() - timedelta(days=2), items=s2_items), central_org.id)

            # Sale 3: FEFO Validation (Should consume near-expiry Azithromycin)
            s3_items = [SaleItemCreate(medicine_id=c_meds[2].id, quantity=25)]
            s3_sale = SaleService.create_sale(db, SaleCreate(invoice_number="SALE-003", customer_id=c_custs[1].id, sale_date=date.today() - timedelta(days=5), items=s3_items), central_org.id)

            # Sale 4: Partial Return Sale
            s4_items = [SaleItemCreate(medicine_id=c_meds[3].id, quantity=10)]
            s4_sale = SaleService.create_sale(db, SaleCreate(invoice_number="SALE-004", customer_id=c_custs[2].id, sale_date=date.today() - timedelta(days=1), items=s4_items), central_org.id)
            
            # Sale 5: Full Return Sale
            s5_items = [SaleItemCreate(medicine_id=c_meds[3].id, quantity=5)]
            s5_sale = SaleService.create_sale(db, SaleCreate(invoice_number="SALE-005", customer_id=c_custs[3].id, sale_date=date.today(), items=s5_items), central_org.id)

            # Process Partial Return on Sale 4
            db.refresh(s4_sale)
            central_owner = db.query(User).filter(User.email == "owner.central@mymedical.test").first()
            r4_items = [SaleReturnItemCreate(sale_item_id=s4_sale.items[0].id, quantity=3)]
            ReturnService.process_return(db, SaleReturnCreate(sale_id=s4_sale.id, reason="Wrong medicine", items=r4_items), central_owner.id, central_org.id)

            # Process Full Return on Sale 5
            db.refresh(s5_sale)
            r5_items = [SaleReturnItemCreate(sale_item_id=s5_sale.items[0].id, quantity=5)]
            ReturnService.process_return(db, SaleReturnCreate(sale_id=s5_sale.id, reason="Defective", items=r5_items), central_owner.id, central_org.id)

        # ---------------------------------------------------------
        # 10. DATABASE VALIDATION
        # ---------------------------------------------------------
        print("Running Validations...")
        
        neg_stock = db.query(Batch).filter(Batch.quantity < 0).count()
        if neg_stock > 0:
            print("❌ Validation Failed: Negative stock found.")
            sys.exit(1)

        neg_points = db.query(Customer).filter(Customer.total_points < 0).count()
        if neg_points > 0:
            print("❌ Validation Failed: Negative customer points found.")
            sys.exit(1)

        null_org = db.query(Sale).filter(Sale.organization_id == None).count()
        if null_org > 0:
            print("❌ Validation Failed: Sales with NULL organization_id found.")
            sys.exit(1)

        # ---------------------------------------------------------
        # 11. SUMMARY
        # ---------------------------------------------------------
        print("\n========================================")
        print("MY MEDICAL DATABASE SEED COMPLETE")
        print("========================================")
        print(f"Organizations: {db.query(Organization).count()}")
        print(f"Plans: {db.query(Plan).count()}")
        print(f"Users: {db.query(User).count()}")
        print(f"Suppliers: {db.query(Supplier).count()}")
        print(f"Medicines: {db.query(Medicine).count()}")
        print(f"Purchases: {db.query(Purchase).count()}")
        print(f"Batches: {db.query(Batch).count()}")
        print(f"Customers: {db.query(Customer).count()}")
        print(f"Sales: {db.query(Sale).count()}")
        print(f"Returns: {db.query(SaleReturn).count()}")
        print(f"Reward Transactions: {db.query(RewardTransaction).count()}")
        
        print("\n----------------------------------------")
        print("LOGIN ACCOUNTS")
        print("----------------------------------------")
        print("SUPER ADMIN\nsuperadmin@mymedical.test\nPassword: Test@12345\n")
        print("CENTRAL OWNER\nowner.central@mymedical.test\nPassword: Test@12345\n")
        print("CENTRAL STAFF\nstaff.central@mymedical.test\nPassword: Test@12345\n")
        print("CITY CARE OWNER\nowner.citycare@mymedical.test\nPassword: Test@12345\n")
        print("========================================\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed Failed: {str(e)}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
