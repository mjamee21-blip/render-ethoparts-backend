from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'etho-parts-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="Etho Parts API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ======================== ENUMS ========================
class UserRole(str, Enum):
    ADMIN = "admin"
    BUYER = "buyer"
    SELLER = "seller"

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PENDING_VERIFICATION = "pending_verification"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentMethod(str, Enum):
    TELEBIRR = "telebirr"
    MANUAL = "manual"

class ProductCondition(str, Enum):
    NEW = "new"
    USED = "used"
    REFURBISHED = "refurbished"

# ======================== MODELS ========================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    role: UserRole = UserRole.BUYER
    business_name: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: str
    role: UserRole
    business_name: Optional[str] = None
    address: Optional[str] = None
    created_at: str

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None

class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category_id: str
    brand: str
    condition: ProductCondition = ProductCondition.NEW
    stock: int = 1
    images: List[str] = []
    compatible_cars: List[str] = []
    specifications: Optional[dict] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[str] = None
    brand: Optional[str] = None
    condition: Optional[ProductCondition] = None
    stock: Optional[int] = None
    images: Optional[List[str]] = None
    compatible_cars: Optional[List[str]] = None
    specifications: Optional[dict] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category_id: str
    category_name: Optional[str] = None
    brand: str
    condition: ProductCondition
    stock: int
    images: List[str]
    compatible_cars: List[str]
    specifications: Optional[dict] = None
    seller_id: str
    seller_name: Optional[str] = None
    avg_rating: float = 0.0
    review_count: int = 0
    created_at: str

class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: str

class ReviewResponse(BaseModel):
    id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: str

class CartItem(BaseModel):
    product_id: str
    quantity: int = 1

class OrderCreate(BaseModel):
    items: List[CartItem]
    shipping_address: str
    shipping_city: str
    shipping_phone: str
    payment_method: PaymentMethod = PaymentMethod.TELEBIRR
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    order_number: str
    buyer_id: str
    items: List[dict]
    total_amount: float
    shipping_address: str
    shipping_city: str
    shipping_phone: str
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    order_status: OrderStatus
    tracking_info: Optional[List[dict]] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class PaymentVerification(BaseModel):
    order_id: str
    transaction_ref: str
    screenshot_url: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    note: Optional[str] = None

# ======================== AUTH HELPERS ========================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_role(allowed_roles: List[UserRole]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in [r.value for r in allowed_roles]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ======================== AUTH ROUTES ========================
@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "role": user_data.role.value,
        "business_name": user_data.business_name,
        "address": user_data.address,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_dict)
    token = create_token(user_dict["id"], user_dict["role"])
    return {"token": token, "user": {k: v for k, v in user_dict.items() if k != "password" and k != "_id"}}

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password" and k != "_id"}}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return user

# ======================== CATEGORY ROUTES ========================
@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    cat_dict = {
        "id": str(uuid.uuid4()),
        "name": category.name,
        "description": category.description,
        "icon": category.icon
    }
    await db.categories.insert_one(cat_dict)
    return {k: v for k, v in cat_dict.items() if k != "_id"}

# ======================== PRODUCT ROUTES ========================
@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category_id: Optional[str] = None,
    brand: Optional[str] = None,
    condition: Optional[ProductCondition] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    seller_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if brand:
        query["brand"] = {"$regex": brand, "$options": "i"}
    if condition:
        query["condition"] = condition.value
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}}
        ]
    if seller_id:
        query["seller_id"] = seller_id
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with category and seller names
    for product in products:
        category = await db.categories.find_one({"id": product["category_id"]}, {"_id": 0})
        if category:
            product["category_name"] = category["name"]
        seller = await db.users.find_one({"id": product["seller_id"]}, {"_id": 0})
        if seller:
            product["seller_name"] = seller.get("business_name") or seller["name"]
    
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    category = await db.categories.find_one({"id": product["category_id"]}, {"_id": 0})
    if category:
        product["category_name"] = category["name"]
    seller = await db.users.find_one({"id": product["seller_id"]}, {"_id": 0})
    if seller:
        product["seller_name"] = seller.get("business_name") or seller["name"]
    
    return product

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in [UserRole.SELLER.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Sellers only")
    
    product_dict = {
        "id": str(uuid.uuid4()),
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "category_id": product.category_id,
        "brand": product.brand,
        "condition": product.condition.value,
        "stock": product.stock,
        "images": product.images,
        "compatible_cars": product.compatible_cars,
        "specifications": product.specifications,
        "seller_id": user["id"],
        "avg_rating": 0.0,
        "review_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product_dict)
    product_dict["seller_name"] = user.get("business_name") or user["name"]
    return {k: v for k, v in product_dict.items() if k != "_id"}

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product_update: ProductUpdate, user: dict = Depends(get_current_user)):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if existing["seller_id"] != user["id"] and user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in product_update.model_dump().items() if v is not None}
    if "condition" in update_data:
        update_data["condition"] = update_data["condition"].value
    
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if existing["seller_id"] != user["id"] and user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.delete_one({"id": product_id})
    return {"message": "Product deleted"}

# ======================== REVIEW ROUTES ========================
@api_router.get("/products/{product_id}/reviews", response_model=List[ReviewResponse])
async def get_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(100)
    return reviews

@api_router.post("/products/{product_id}/reviews", response_model=ReviewResponse)
async def create_review(product_id: str, review: ReviewCreate, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing_review = await db.reviews.find_one({"product_id": product_id, "user_id": user["id"]})
    if existing_review:
        raise HTTPException(status_code=400, detail="You already reviewed this product")
    
    review_dict = {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review_dict)
    
    # Update product rating
    all_reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"avg_rating": round(avg_rating, 1), "review_count": len(all_reviews)}}
    )
    
    return {k: v for k, v in review_dict.items() if k != "_id"}

# ======================== ORDER ROUTES ========================
@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, user: dict = Depends(get_current_user)):
    items_with_details = []
    total_amount = 0
    
    for item in order_data.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        if product["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        
        item_total = product["price"] * item.quantity
        total_amount += item_total
        items_with_details.append({
            "product_id": item.product_id,
            "product_name": product["name"],
            "quantity": item.quantity,
            "price": product["price"],
            "total": item_total,
            "seller_id": product["seller_id"]
        })
    
    order_number = f"EP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    order_dict = {
        "id": str(uuid.uuid4()),
        "order_number": order_number,
        "buyer_id": user["id"],
        "items": items_with_details,
        "total_amount": total_amount,
        "shipping_address": order_data.shipping_address,
        "shipping_city": order_data.shipping_city,
        "shipping_phone": order_data.shipping_phone,
        "payment_method": order_data.payment_method.value,
        "payment_status": PaymentStatus.PENDING.value,
        "order_status": OrderStatus.PENDING.value,
        "tracking_info": [{"status": "Order Placed", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Order has been placed"}],
        "notes": order_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_dict)
    
    # Update stock
    for item in order_data.items:
        await db.products.update_one(
            {"id": item.product_id},
            {"$inc": {"stock": -item.quantity}}
        )
    
    return {k: v for k, v in order_dict.items() if k != "_id"}

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(user: dict = Depends(get_current_user)):
    if user["role"] == UserRole.ADMIN.value:
        orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    elif user["role"] == UserRole.SELLER.value:
        orders = await db.orders.find({"items.seller_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    else:
        orders = await db.orders.find({"buyer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check access
    if user["role"] == UserRole.BUYER.value and order["buyer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if user["role"] == UserRole.SELLER.value:
        seller_items = [i for i in order["items"] if i["seller_id"] == user["id"]]
        if not seller_items:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return order

@api_router.get("/orders/track/{order_number}")
async def track_order(order_number: str):
    order = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "order_number": order["order_number"],
        "order_status": order["order_status"],
        "payment_status": order["payment_status"],
        "tracking_info": order["tracking_info"],
        "created_at": order["created_at"]
    }

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: OrderStatusUpdate, user: dict = Depends(get_current_user)):
    if user["role"] not in [UserRole.SELLER.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    tracking_entry = {
        "status": status_update.status.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": status_update.note or f"Status updated to {status_update.status.value}"
    }
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "order_status": status_update.status.value,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"tracking_info": tracking_entry}
        }
    )
    
    return {"message": "Status updated", "status": status_update.status.value}

# ======================== PAYMENT ROUTES ========================
@api_router.post("/payments/verify")
async def verify_payment(verification: PaymentVerification, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": verification.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["buyer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Save payment verification for admin review
    payment_record = {
        "id": str(uuid.uuid4()),
        "order_id": verification.order_id,
        "user_id": user["id"],
        "transaction_ref": verification.transaction_ref,
        "screenshot_url": verification.screenshot_url,
        "status": "pending_review",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_record)
    
    # Update order payment status to pending verification
    await db.orders.update_one(
        {"id": verification.order_id},
        {"$set": {"payment_status": "pending_verification", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Payment verification submitted", "payment_id": payment_record["id"]}

@api_router.get("/payments/pending")
async def get_pending_payments(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    payments = await db.payments.find({"status": "pending_review"}, {"_id": 0}).to_list(100)
    return payments

@api_router.post("/payments/{payment_id}/confirm")
async def confirm_payment(payment_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await db.payments.update_one({"id": payment_id}, {"$set": {"status": "confirmed"}})
    await db.orders.update_one(
        {"id": payment["order_id"]},
        {
            "$set": {
                "payment_status": PaymentStatus.COMPLETED.value,
                "order_status": OrderStatus.CONFIRMED.value,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"tracking_info": {
                "status": "Payment Confirmed",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "note": "Payment has been verified and confirmed"
            }}
        }
    )
    
    return {"message": "Payment confirmed"}

# ======================== ADMIN ROUTES ========================
@api_router.get("/admin/users")
async def get_all_users(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.get("/admin/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    total_users = await db.users.count_documents({})
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    pending_payments = await db.payments.count_documents({"status": "pending_review"})
    
    # Calculate total revenue
    completed_orders = await db.orders.find({"payment_status": PaymentStatus.COMPLETED.value}, {"_id": 0}).to_list(10000)
    total_revenue = sum(o["total_amount"] for o in completed_orders)
    
    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "pending_payments": pending_payments,
        "total_revenue": total_revenue
    }

# ======================== SELLER ROUTES ========================
@api_router.get("/seller/stats")
async def get_seller_stats(user: dict = Depends(get_current_user)):
    if user["role"] not in [UserRole.SELLER.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Sellers only")
    
    total_products = await db.products.count_documents({"seller_id": user["id"]})
    orders = await db.orders.find({"items.seller_id": user["id"]}, {"_id": 0}).to_list(10000)
    
    total_orders = len(orders)
    total_revenue = sum(
        sum(item["total"] for item in o["items"] if item["seller_id"] == user["id"])
        for o in orders if o["payment_status"] == PaymentStatus.COMPLETED.value
    )
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": total_revenue
    }

# ======================== SEED DATA ========================
@api_router.post("/seed")
async def seed_data():
    # Check if already seeded
    existing_categories = await db.categories.count_documents({})
    if existing_categories > 0:
        return {"message": "Already seeded"}
    
    # Create categories
    categories = [
        {"id": str(uuid.uuid4()), "name": "Engine Parts", "description": "Engine components and accessories", "icon": "engine"},
        {"id": str(uuid.uuid4()), "name": "Brakes", "description": "Brake pads, rotors, and systems", "icon": "brake"},
        {"id": str(uuid.uuid4()), "name": "Suspension", "description": "Shocks, struts, and springs", "icon": "suspension"},
        {"id": str(uuid.uuid4()), "name": "Electrical", "description": "Batteries, alternators, starters", "icon": "electrical"},
        {"id": str(uuid.uuid4()), "name": "Body Parts", "description": "Bumpers, doors, mirrors", "icon": "body"},
        {"id": str(uuid.uuid4()), "name": "Filters", "description": "Air, oil, and fuel filters", "icon": "filter"},
        {"id": str(uuid.uuid4()), "name": "Lighting", "description": "Headlights, taillights, bulbs", "icon": "light"},
        {"id": str(uuid.uuid4()), "name": "Tires & Wheels", "description": "Tires, rims, and accessories", "icon": "tire"},
    ]
    await db.categories.insert_many(categories)
    
    # Create admin user
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "admin@ethoparts.com",
        "password": hash_password("admin123"),
        "name": "Etho Parts Admin",
        "phone": "0777770757",
        "role": UserRole.ADMIN.value,
        "business_name": "Etho Parts",
        "address": "Addis Ababa, Ethiopia",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_user)
    
    # Create sample seller
    seller_user = {
        "id": str(uuid.uuid4()),
        "email": "seller@ethoparts.com",
        "password": hash_password("seller123"),
        "name": "Auto Parts Dealer",
        "phone": "0911223344",
        "role": UserRole.SELLER.value,
        "business_name": "Addis Auto Parts",
        "address": "Merkato, Addis Ababa",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(seller_user)
    
    # Create sample products
    sample_products = [
        {"name": "Toyota Corolla Brake Pads", "description": "High-quality ceramic brake pads for Toyota Corolla 2015-2023. Excellent stopping power with low dust.", "price": 2500, "category_id": categories[1]["id"], "brand": "Bosch", "condition": "new", "stock": 25, "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"], "compatible_cars": ["Toyota Corolla", "Toyota Camry"], "seller_id": seller_user["id"]},
        {"name": "Nissan Sunny Air Filter", "description": "OEM quality air filter for Nissan Sunny. Improves engine performance and fuel efficiency.", "price": 450, "category_id": categories[5]["id"], "brand": "Mann", "condition": "new", "stock": 50, "images": ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400"], "compatible_cars": ["Nissan Sunny", "Nissan Almera"], "seller_id": seller_user["id"]},
        {"name": "Universal LED Headlight Bulbs", "description": "6000K bright white LED headlight bulbs. Easy installation, fits most vehicles.", "price": 1200, "category_id": categories[6]["id"], "brand": "Philips", "condition": "new", "stock": 100, "images": ["https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400"], "compatible_cars": ["Universal"], "seller_id": seller_user["id"]},
        {"name": "Suzuki Swift Alternator", "description": "Remanufactured alternator for Suzuki Swift 2010-2020. 1-year warranty included.", "price": 8500, "category_id": categories[3]["id"], "brand": "Denso", "condition": "refurbished", "stock": 8, "images": ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400"], "compatible_cars": ["Suzuki Swift", "Suzuki Dzire"], "seller_id": seller_user["id"]},
        {"name": "Hyundai Accent Shock Absorbers", "description": "Front shock absorbers set for Hyundai Accent. OEM quality replacement.", "price": 4200, "category_id": categories[2]["id"], "brand": "KYB", "condition": "new", "stock": 15, "images": ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400"], "compatible_cars": ["Hyundai Accent", "Hyundai Verna"], "seller_id": seller_user["id"]},
        {"name": "Toyota Hilux Oil Filter", "description": "Genuine oil filter for Toyota Hilux diesel engines. Excellent filtration quality.", "price": 350, "category_id": categories[5]["id"], "brand": "Toyota", "condition": "new", "stock": 75, "images": ["https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400"], "compatible_cars": ["Toyota Hilux", "Toyota Fortuner"], "seller_id": seller_user["id"]},
        {"name": "Side Mirror (Left) - Universal", "description": "Universal fit left side mirror. Manual adjustment, fits most sedan models.", "price": 650, "category_id": categories[4]["id"], "brand": "Generic", "condition": "new", "stock": 30, "images": ["https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400"], "compatible_cars": ["Universal"], "seller_id": seller_user["id"]},
        {"name": "Car Battery 12V 60Ah", "description": "Maintenance-free car battery. Suitable for most passenger vehicles.", "price": 5500, "category_id": categories[3]["id"], "brand": "Exide", "condition": "new", "stock": 20, "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"], "compatible_cars": ["Universal"], "seller_id": seller_user["id"]},
        {"name": "Timing Belt Kit - Toyota", "description": "Complete timing belt kit for Toyota 1.6L-2.0L engines. Includes tensioner and water pump.", "price": 3800, "category_id": categories[0]["id"], "brand": "Gates", "condition": "new", "stock": 12, "images": ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400"], "compatible_cars": ["Toyota Corolla", "Toyota Yaris", "Toyota Avensis"], "seller_id": seller_user["id"]},
        {"name": "Isuzu D-Max Clutch Kit", "description": "Complete clutch kit for Isuzu D-Max. Includes pressure plate, disc, and bearing.", "price": 7200, "category_id": categories[0]["id"], "brand": "Valeo", "condition": "new", "stock": 6, "images": ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400"], "compatible_cars": ["Isuzu D-Max", "Isuzu MU-X"], "seller_id": seller_user["id"]},
        {"name": "Spark Plugs Set (4pcs)", "description": "Iridium spark plugs for better ignition and fuel economy. Set of 4.", "price": 1600, "category_id": categories[0]["id"], "brand": "NGK", "condition": "new", "stock": 40, "images": ["https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400"], "compatible_cars": ["Universal"], "seller_id": seller_user["id"]},
        {"name": "Radiator - Honda Civic", "description": "Aluminum radiator for Honda Civic 2006-2011. Direct fit replacement.", "price": 4500, "category_id": categories[0]["id"], "brand": "Denso", "condition": "new", "stock": 10, "images": ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400"], "compatible_cars": ["Honda Civic", "Honda City"], "seller_id": seller_user["id"]},
    ]
    
    for product in sample_products:
        product["id"] = str(uuid.uuid4())
        product["avg_rating"] = round(3.5 + (hash(product["name"]) % 15) / 10, 1)
        product["review_count"] = hash(product["name"]) % 20
        product["created_at"] = datetime.now(timezone.utc).isoformat()
        if "specifications" not in product:
            product["specifications"] = None
    
    await db.products.insert_many(sample_products)
    
    return {"message": "Data seeded successfully", "categories": len(categories), "products": len(sample_products)}

@api_router.get("/")
async def root():
    return {"message": "Etho Parts API", "version": "1.0.0"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
