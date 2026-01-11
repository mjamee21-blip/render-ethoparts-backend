#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class EthoPartsAPITester:
    def __init__(self, base_url="https://ethiopartshub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.seller_token = None
        self.buyer_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.categories = []
        self.products = []
        self.orders = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"name": name, "details": details})

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            success = response.status_code == expected_status
            return success, response.json() if success else {}, response.status_code
        except Exception as e:
            return False, {}, str(e)

    def test_seed_data(self):
        """Test seeding initial data"""
        success, data, status = self.make_request('POST', 'seed', expected_status=200)
        self.log_test("Seed Data", success, f"Status: {status}")
        return success

    def test_get_categories(self):
        """Test getting categories"""
        success, data, status = self.make_request('GET', 'categories')
        if success and isinstance(data, list) and len(data) > 0:
            self.categories = data
            self.log_test("Get Categories", True, f"Found {len(data)} categories")
            return True
        else:
            self.log_test("Get Categories", False, f"Status: {status}, Data: {data}")
            return False

    def test_get_products(self):
        """Test getting products"""
        success, data, status = self.make_request('GET', 'products')
        if success and isinstance(data, list) and len(data) > 0:
            self.products = data
            self.log_test("Get Products", True, f"Found {len(data)} products")
            return True
        else:
            self.log_test("Get Products", False, f"Status: {status}, Data: {data}")
            return False

    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "email": "admin@ethoparts.com",
            "password": "admin123"
        }
        success, data, status = self.make_request('POST', 'auth/login', login_data)
        if success and 'token' in data:
            self.admin_token = data['token']
            self.log_test("Admin Login", True, f"Role: {data.get('user', {}).get('role', 'unknown')}")
            return True
        else:
            self.log_test("Admin Login", False, f"Status: {status}, Data: {data}")
            return False

    def test_seller_login(self):
        """Test seller login"""
        login_data = {
            "email": "seller@ethoparts.com",
            "password": "seller123"
        }
        success, data, status = self.make_request('POST', 'auth/login', login_data)
        if success and 'token' in data:
            self.seller_token = data['token']
            self.log_test("Seller Login", True, f"Role: {data.get('user', {}).get('role', 'unknown')}")
            return True
        else:
            self.log_test("Seller Login", False, f"Status: {status}, Data: {data}")
            return False

    def test_buyer_registration(self):
        """Test buyer registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        register_data = {
            "email": f"testbuyer{timestamp}@test.com",
            "password": "testpass123",
            "name": "Test Buyer",
            "phone": "0912345678",
            "role": "buyer"
        }
        success, data, status = self.make_request('POST', 'auth/register', register_data)
        if success and 'token' in data:
            self.buyer_token = data['token']
            self.log_test("Buyer Registration", True, f"Email: {register_data['email']}")
            return True
        else:
            self.log_test("Buyer Registration", False, f"Status: {status}, Data: {data}")
            return False

    def test_create_product(self):
        """Test creating a product as seller"""
        if not self.seller_token or not self.categories:
            self.log_test("Create Product", False, "Missing seller token or categories")
            return False

        product_data = {
            "name": "Test Auto Part",
            "description": "Test description for auto part",
            "price": 1500.0,
            "category_id": self.categories[0]['id'],
            "brand": "Test Brand",
            "condition": "new",
            "stock": 10,
            "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"],
            "compatible_cars": ["Toyota Corolla", "Honda Civic"]
        }
        success, data, status = self.make_request('POST', 'products', product_data, self.seller_token, 200)
        if success and 'id' in data:
            self.log_test("Create Product", True, f"Product ID: {data['id']}")
            return True
        else:
            self.log_test("Create Product", False, f"Status: {status}, Data: {data}")
            return False

    def test_create_order(self):
        """Test creating an order as buyer"""
        if not self.buyer_token or not self.products:
            self.log_test("Create Order", False, "Missing buyer token or products")
            return False

        # Get seller payment methods for the first product
        seller_id = self.products[0]['seller_id']
        success, payment_methods, status = self.make_request('GET', f'seller/{seller_id}/payment-methods')
        if not success or not payment_methods:
            self.log_test("Create Order", False, f"No payment methods available for seller")
            return False

        order_data = {
            "items": [
                {
                    "product_id": self.products[0]['id'],
                    "quantity": 1
                }
            ],
            "shipping_address": "123 Test Street, Addis Ababa",
            "shipping_city": "Addis Ababa",
            "shipping_phone": "0912345678",
            "payment_method_id": payment_methods[0]['id'],  # Use seller payment method ID
            "notes": "Test order"
        }
        success, data, status = self.make_request('POST', 'orders', order_data, self.buyer_token, 200)
        if success and 'id' in data:
            self.orders.append(data)
            self.log_test("Create Order", True, f"Order Number: {data.get('order_number', 'N/A')}")
            return True
        else:
            self.log_test("Create Order", False, f"Status: {status}, Data: {data}")
            return False

    def test_order_tracking(self):
        """Test order tracking without authentication"""
        if not self.orders:
            self.log_test("Order Tracking", False, "No orders to track")
            return False

        order_number = self.orders[0]['order_number']
        success, data, status = self.make_request('GET', f'orders/track/{order_number}')
        if success and 'order_number' in data:
            self.log_test("Order Tracking", True, f"Status: {data.get('order_status', 'unknown')}")
            return True
        else:
            self.log_test("Order Tracking", False, f"Status: {status}, Data: {data}")
            return False

    def test_payment_verification(self):
        """Test payment verification"""
        if not self.buyer_token or not self.orders:
            self.log_test("Payment Verification", False, "Missing buyer token or orders")
            return False

        verification_data = {
            "order_id": self.orders[0]['id'],
            "transaction_ref": "TEST123456789"
        }
        success, data, status = self.make_request('POST', 'payments/verify', verification_data, self.buyer_token, 200)
        if success:
            self.log_test("Payment Verification", True, f"Payment ID: {data.get('payment_id', 'N/A')}")
            return True
        else:
            self.log_test("Payment Verification", False, f"Status: {status}, Data: {data}")
            return False

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        if not self.admin_token:
            self.log_test("Admin Stats", False, "Missing admin token")
            return False

        success, data, status = self.make_request('GET', 'admin/stats', token=self.admin_token)
        if success and 'total_users' in data:
            self.log_test("Admin Stats", True, f"Users: {data.get('total_users', 0)}, Products: {data.get('total_products', 0)}")
            return True
        else:
            self.log_test("Admin Stats", False, f"Status: {status}, Data: {data}")
            return False

    def test_seller_stats(self):
        """Test seller stats endpoint"""
        if not self.seller_token:
            self.log_test("Seller Stats", False, "Missing seller token")
            return False

        success, data, status = self.make_request('GET', 'seller/stats', token=self.seller_token)
        if success and 'total_products' in data:
            self.log_test("Seller Stats", True, f"Products: {data.get('total_products', 0)}, Orders: {data.get('total_orders', 0)}")
            return True
        else:
            self.log_test("Seller Stats", False, f"Status: {status}, Data: {data}")
            return False

    def test_get_orders_buyer(self):
        """Test getting orders as buyer"""
        if not self.buyer_token:
            self.log_test("Get Orders (Buyer)", False, "Missing buyer token")
            return False

        success, data, status = self.make_request('GET', 'orders', token=self.buyer_token)
        if success and isinstance(data, list):
            self.log_test("Get Orders (Buyer)", True, f"Found {len(data)} orders")
            return True
        else:
            self.log_test("Get Orders (Buyer)", False, f"Status: {status}, Data: {data}")
            return False

    def test_product_reviews(self):
        """Test product reviews"""
        if not self.buyer_token or not self.products:
            self.log_test("Product Reviews", False, "Missing buyer token or products")
            return False

        product_id = self.products[0]['id']
        
        # Create a review
        review_data = {
            "product_id": product_id,
            "rating": 5,
            "comment": "Great product! Highly recommended."
        }
        success, data, status = self.make_request('POST', f'products/{product_id}/reviews', review_data, self.buyer_token, 200)
        if success:
            self.log_test("Create Product Review", True, f"Review ID: {data.get('id', 'N/A')}")
            
            # Get reviews
            success2, data2, status2 = self.make_request('GET', f'products/{product_id}/reviews')
            if success2 and isinstance(data2, list):
                self.log_test("Get Product Reviews", True, f"Found {len(data2)} reviews")
                return True
            else:
                self.log_test("Get Product Reviews", False, f"Status: {status2}")
                return False
        else:
            self.log_test("Create Product Review", False, f"Status: {status}, Data: {data}")
            return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Etho Parts API Tests")
        print("=" * 50)

        # Basic functionality tests
        self.test_seed_data()
        self.test_get_categories()
        self.test_get_products()

        # Authentication tests
        self.test_admin_login()
        self.test_seller_login()
        self.test_buyer_registration()

        # Product management tests
        self.test_create_product()

        # Order management tests
        self.test_create_order()
        self.test_order_tracking()
        self.test_payment_verification()

        # Dashboard tests
        self.test_admin_stats()
        self.test_seller_stats()
        self.test_get_orders_buyer()

        # Review tests
        self.test_product_reviews()

        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = EthoPartsAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())