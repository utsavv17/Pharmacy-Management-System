# Frontend-Backend Gaps

This document outlines the features required by the business specification that are currently **missing** from the existing FastAPI backend. To maintain the integrity of the application, these features have not been faked or mocked on the frontend. They require backend implementation before they can be fully supported in the UI.

## 1. Customers and Loyalty / Reward Points
**Missing functionality:**
- No `Customer` database model.
- No endpoints to create, update, or list customers.
- No fields or logic to track customer reward points (earned or redeemed).
- The `SaleCreate` schema (`/sales/create`) only accepts a `customer_name` string, not a reference to a customer entity.

**Required Backend Changes:**
1. Create a `Customer` model (id, name, phone, email, total_points, etc.).
2. Add CRUD endpoints for `/customers/`.
3. Update `Sale` model and schema to reference `customer_id`.
4. Add business logic to calculate points earned during a sale and logic to redeem points as a discount.

## 2. Categories
**Missing functionality:**
- The `Medicine` model has a `category` string field, but there is no `Category` model or table.
- No endpoints to manage or fetch a list of available categories.

**Required Backend Changes:**
1. Create a `Category` model and CRUD endpoints, OR add an endpoint to fetch unique categories from existing medicines if they remain a simple string.

## 3. Roles and Permissions
**Missing functionality:**
- Roles are limited to a hardcoded string `admin` or `staff` in the `User` model.
- There are no fine-grained permissions or endpoints to manage roles.

**Required Backend Changes:**
1. (Optional) Create a more robust roles and permissions system if fine-grained access control is needed in the future. Currently, frontend simply uses the `admin` vs `staff` string check.
