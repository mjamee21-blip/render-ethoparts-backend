# Etho Parts - Auto Parts Store PRD

## Original Problem Statement
Create auto parts store with payment method enabled for users in Ethiopia. Features include:
- 3 user roles: Admin (store owner), Buyer, Seller (merchants)
- Top 10 Ethiopian payment methods (Telebirr, CBE Birr, Amole, M-Birr, HelloCash, CBE, Awash Bank, Dashen Bank, Bank of Abyssinia, Wegagen Bank)
- Offline payment with receipt upload
- Admin controls payment methods globally
- Merchants select which payment methods to offer
- 10% commission on sales, payable within 48 hours
- Store: Etho Parts, Addis Ababa, Phone: 0777770757

## User Personas
1. **Admin**: Controls payment methods, verifies payments & commissions, manages platform
2. **Buyer**: Purchases auto parts, pays offline, uploads receipts
3. **Seller/Merchant**: Lists products, selects payment methods, pays 10% commission

## What's Been Implemented (January 2025)

### Backend (FastAPI + MongoDB)
- [x] JWT Authentication with 3 roles
- [x] 10 Ethiopian payment methods (Telebirr, CBE Birr, Amole, M-Birr, HelloCash, CBE, Awash, Dashen, BOA, Wegagen)
- [x] Admin payment method management (enable/disable, CRUD)
- [x] Seller payment method selection from enabled list
- [x] Order creation with seller's payment methods
- [x] Receipt upload for payment verification
- [x] Payment verification by seller/admin
- [x] 10% commission tracking per sale
- [x] 48-hour commission due date
- [x] Commission payment submission with receipt
- [x] Admin commission payment verification
- [x] Sales tracking for merchants and admin

### Frontend (React + TailwindCSS + Shadcn UI)
- [x] Ethiopian "Addis Industrial" theme with flag colors
- [x] One-page design with smooth scrolling
- [x] Product catalog with advanced filtering
- [x] Cart & checkout with seller's payment methods
- [x] Receipt upload in checkout flow
- [x] Buyer dashboard with order history
- [x] Seller dashboard with:
  - Products management
  - Orders management
  - Payment verification
  - Payment methods selection
  - Commission tracking with "Pay Now"
- [x] Admin dashboard with:
  - Platform stats
  - Payment methods management (toggle on/off)
  - Payment verification
  - Commission management
  - Commission payment method settings

### Demo Accounts
- Admin: admin@ethoparts.com / admin123
- Seller: seller@ethoparts.com / seller123

### Payment Flow
1. Buyer selects products → Checkout
2. Buyer sees seller's payment methods with account details
3. Buyer pays offline (Telebirr, bank, etc.)
4. Buyer uploads receipt with transaction reference
5. Seller/Admin verifies payment
6. Order confirmed → Commission record created (10%)
7. Seller has 48 hours to pay commission to admin
8. Seller uploads commission receipt
9. Admin verifies commission payment

## Next Tasks
1. Email/SMS notifications for orders and commissions
2. Image upload for products and receipts (currently URL/base64)
3. Overdue commission alerts
4. Seller verification/approval system
