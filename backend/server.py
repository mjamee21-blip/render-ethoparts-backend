from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query, UploadFile, File
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
import base64

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

# Commission rate
COMMISSION_RATE = 0.10  # 10%
COMMISSION_DUE_HOURS = 48

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

class CommissionStatus(str, Enum):
    PENDING = "pending"
    PENDING_VERIFICATION = "pending_verification"
    PAID = "paid"
    OVERDUE = "overdue"

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
    enabled_payment_methods: Optional[List[str]] = None

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
    payment_method_id: str
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    order_number: str
    buyer_id: str
    items: List[dict]
    total_amount: float
    commission_amount: float
    shipping_address: str
    shipping_city: str
    shipping_phone: str
    payment_method_id: str
    payment_method_name: Optional[str] = None
    payment_status: PaymentStatus
    order_status: OrderStatus
    tracking_info: Optional[List[dict]] = None
    notes: Optional[str] = None
    receipt_url: Optional[str] = None
    created_at: str
    updated_at: str

class PaymentMethodCreate(BaseModel):
    name: str
    type: str  # ewallet, bank, mobile_money
    account_name: str
    account_number: str
    instructions: Optional[str] = None
    logo_url: Optional[str] = None

class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = None
    account_name: Optional[str] = None
    account_number: Optional[str] = None
    instructions: Optional[str] = None
    logo_url: Optional[str] = None
    enabled: Optional[bool] = None

class SellerPaymentMethodCreate(BaseModel):
    payment_method_id: str
    account_name: str
    account_number: str

class PaymentVerification(BaseModel):
    order_id: str
    transaction_ref: str
    receipt_image: Optional[str] = None  # Base64 encoded image

class CommissionPayment(BaseModel):
    commission_id: str
    transaction_ref: str
    receipt_image: Optional[str] = None

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
        "enabled_payment_methods": [],
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

# ======================== PAYMENT METHOD ROUTES ========================
@api_router.get("/payment-methods")
async def get_payment_methods(enabled_only: bool = False):
    """Get all payment methods (public)"""
    query = {"enabled": True} if enabled_only else {}
    methods = await db.payment_methods.find(query, {"_id": 0}).to_list(100)
    return methods

@api_router.get("/payment-methods/admin")
async def get_all_payment_methods(user: dict = Depends(get_current_user)):
    """Get all payment methods for admin"""
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    methods = await db.payment_methods.find({}, {"_id": 0}).to_list(100)
    return methods

@api_router.post("/payment-methods")
async def create_payment_method(method: PaymentMethodCreate, user: dict = Depends(get_current_user)):
    """Admin creates a new payment method"""
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    method_dict = {
        "id": str(uuid.uuid4()),
        "name": method.name,
        "type": method.type,
        "account_name": method.account_name,
        "account_number": method.account_number,
        "instructions": method.instructions,
        "logo_url": method.logo_url,
        "enabled": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_methods.insert_one(method_dict)
    return {k: v for k, v in method_dict.items() if k != "_id"}

@api_router.put("/payment-methods/{method_id}")
async def update_payment_method(method_id: str, update: PaymentMethodUpdate, user: dict = Depends(get_current_user)):
    """Admin updates a payment method"""
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    existing = await db.payment_methods.find_one({"id": method_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.payment_methods.update_one({"id": method_id}, {"$set": update_data})
    
    updated = await db.payment_methods.find_one({"id": method_id}, {"_id": 0})
    return updated

@api_router.delete("/payment-methods/{method_id}")
async def delete_payment_method(method_id: str, user: dict = Depends(get_current_user)):
    """Admin deletes a payment method"""
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    await db.payment_methods.delete_one({"id": method_id})
    return {"message": "Payment method deleted"}

@api_router.post("/payment-methods/{method_id}/toggle")
async def toggle_payment_method(method_id: str, user: dict = Depends(get_current_user)):
    """Admin toggles payment method enabled/disabled"""
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    method = await db.payment_methods.find_one({"id": method_id})
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    new_status = not method.get("enabled", True)
    await db.payment_methods.update_one({"id": method_id}, {"$set": {"enabled": new_status}})
    return {"enabled": new_status}

# ======================== SELLER PAYMENT METHOD ROUTES ========================
@api_router.get("/seller/payment-methods")
async def get_seller_payment_methods(user: dict = Depends(get_current_user)):
    """Get seller's enabled payment methods"""
    if user["role"] not in [UserRole.SELLER.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Sellers only")
    
    seller_methods = await db.seller_payment_methods.find(
        {"seller_id": user["id"]}, {"_id": 0}
    ).to_list(100)
    
    # Enrich with payment method details
    for sm in seller_methods:
        method = await db.payment_methods.find_one({"id": sm["payment_method_id"]}, {"_id": 0})
        if method:
            sm["method_name"] = method["name"]
            sm["method_type"] = method["type"]
            sm["method_logo"] = method.get("logo_url")
    
    return seller_methods

@api_router.post("/seller/payment-methods")
async def add_seller_payment_method(data: SellerPaymentMethodCreate, user: dict = Depends(get_current_user)):
    """Seller adds a payment method with their account details"""
    if user["role"] not in [UserRole.SELLER.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Sellers only")
    
    # Check if payment method is enabled by admin
    method = await db.payment_methods.find_one({"id": data.payment_method_id, "enabled": True})
    if not method:
        raise HTTPException(status_code=400, detail="Payment method not available")
    
    # Check if seller already has this method
    existing = await db.seller_payment_methods.find_one({
        "seller_id": user["id"],
        "payment_method_id": data.payment_method_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Payment method already added")
    
    seller_method = {
        "id": str(uuid.uuid4()),
        "seller_id": user["id"],
        "payment_method_id": data.payment_method_id,
        "account_name": data.account_name,
        "account_number": data.account_number,
        "enabled": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.seller_payment_methods.insert_one(seller_method)
    
    # Update user's enabled payment methods list
    await db.users.update_one(
        {"id": user["id"]},
        {"$addToSet": {"enabled_payment_methods": data.payment_method_id}}
    )
    
    return {k: v for k, v in seller_method.items() if k != "_id"}

@api_router.delete("/seller/payment-methods/{method_id}")
async def remove_seller_payment_method(method_id: str, user: dict = Depends(get_current_user)):
    """Seller removes a payment method"""
    if user["role"] not in [UserRole.SELLER.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Sellers only")
    
    seller_method = await db.seller_payment_methods.find_one({"id": method_id, "seller_id": user["id"]})
    if not seller_method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    await db.seller_payment_methods.delete_one({"id": method_id})
    
    # Update user's enabled payment methods list
    await db.users.update_one(
        {"id": user["id"]},
        {"$pull": {"enabled_payment_methods": seller_method["payment_method_id"]}}
    )
    
    return {"message": "Payment method removed"}

@api_router.get("/seller/{seller_id}/payment-methods")
async def get_seller_available_payment_methods(seller_id: str):
    """Get available payment methods for a specific seller (for buyers)"""
    seller_methods = await db.seller_payment_methods.find(
        {"seller_id": seller_id, "enabled": True}, {"_id": 0}
    ).to_list(100)
    
    result = []
    for sm in seller_methods:
        method = await db.payment_methods.find_one({"id": sm["payment_method_id"], "enabled": True}, {"_id": 0})
        if method:
            result.append({
                "id": sm["id"],
                "payment_method_id": method["id"],
                "name": method["name"],
                "type": method["type"],
                "logo_url": method.get("logo_url"),
                "account_name": sm["account_name"],
                "account_number": sm["account_number"],
                "instructions": method.get("instructions")
            })
    
    return result

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
    
    all_reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"avg_rating": round(avg_rating, 1), "review_count": len(all_reviews)}}
    )
    
    return {k: v for k, v in review_dict.items() if k != "_id"}

# ======================== ORDER ROUTES ========================
@api_router.post("/orders")
async def create_order(order_data: OrderCreate, user: dict = Depends(get_current_user)):
    items_with_details = []
    total_amount = 0
    sellers = set()
    
    for item in order_data.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        if product["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        
        item_total = product["price"] * item.quantity
        total_amount += item_total
        sellers.add(product["seller_id"])
        items_with_details.append({
            "product_id": item.product_id,
            "product_name": product["name"],
            "quantity": item.quantity,
            "price": product["price"],
            "total": item_total,
            "seller_id": product["seller_id"]
        })
    
    # Validate payment method
    seller_method = await db.seller_payment_methods.find_one({"id": order_data.payment_method_id})
    if not seller_method:
        raise HTTPException(status_code=400, detail="Invalid payment method")
    
    payment_method = await db.payment_methods.find_one({"id": seller_method["payment_method_id"]}, {"_id": 0})
    
    commission_amount = round(total_amount * COMMISSION_RATE, 2)
    order_number = f"EP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    order_dict = {
        "id": str(uuid.uuid4()),
        "order_number": order_number,
        "buyer_id": user["id"],
        "items": items_with_details,
        "total_amount": total_amount,
        "commission_amount": commission_amount,
        "shipping_address": order_data.shipping_address,
        "shipping_city": order_data.shipping_city,
        "shipping_phone": order_data.shipping_phone,
        "payment_method_id": order_data.payment_method_id,
        "payment_method_name": payment_method["name"] if payment_method else None,
        "seller_payment_details": {
            "account_name": seller_method["account_name"],
            "account_number": seller_method["account_number"]
        },
        "payment_status": PaymentStatus.PENDING.value,
        "order_status": OrderStatus.PENDING.value,
        "tracking_info": [{"status": "Order Placed", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Order has been placed. Awaiting payment."}],
        "notes": order_data.notes,
        "receipt_url": None,
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

@api_router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user)):
    if user["role"] == UserRole.ADMIN.value:
        orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    elif user["role"] == UserRole.SELLER.value:
        orders = await db.orders.find({"items.seller_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    else:
        orders = await db.orders.find({"buyer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
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

# ======================== PAYMENT & RECEIPT ROUTES ========================
@api_router.post("/payments/upload-receipt")
async def upload_receipt(verification: PaymentVerification, user: dict = Depends(get_current_user)):
    """Buyer uploads payment receipt"""
    order = await db.orders.find_one({"id": verification.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["buyer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    payment_record = {
        "id": str(uuid.uuid4()),
        "order_id": verification.order_id,
        "user_id": user["id"],
        "transaction_ref": verification.transaction_ref,
        "receipt_image": verification.receipt_image,
        "status": "pending_review",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_record)
    
    await db.orders.update_one(
        {"id": verification.order_id},
        {
            "$set": {
                "payment_status": PaymentStatus.PENDING_VERIFICATION.value,
                "receipt_url": verification.receipt_image,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"tracking_info": {
                "status": "Receipt Uploaded",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "note": f"Payment receipt uploaded. Reference: {verification.transaction_ref}"
            }}
        }
    )
    
    return {"message": "Receipt uploaded successfully", "payment_id": payment_record["id"]}

@api_router.get("/payments/pending")
async def get_pending_payments(user: dict = Depends(get_current_user)):
    """Get pending payment verifications"""
    if user["role"] == UserRole.ADMIN.value:
        payments = await db.payments.find({"status": "pending_review"}, {"_id": 0}).to_list(100)
    elif user["role"] == UserRole.SELLER.value:
        # Get seller's orders first
        seller_orders = await db.orders.find({"items.seller_id": user["id"]}, {"_id": 0, "id": 1}).to_list(1000)
        order_ids = [o["id"] for o in seller_orders]
        payments = await db.payments.find(
            {"status": "pending_review", "order_id": {"$in": order_ids}}, {"_id": 0}
        ).to_list(100)
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Enrich with order details
    for p in payments:
        order = await db.orders.find_one({"id": p["order_id"]}, {"_id": 0})
        if order:
            p["order_number"] = order["order_number"]
            p["total_amount"] = order["total_amount"]
            p["payment_method_name"] = order.get("payment_method_name")
    
    return payments

@api_router.post("/payments/{payment_id}/confirm")
async def confirm_payment(payment_id: str, user: dict = Depends(get_current_user)):
    """Admin or Seller confirms a payment"""
    if user["role"] not in [UserRole.ADMIN.value, UserRole.SELLER.value]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    order = await db.orders.find_one({"id": payment["order_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # If seller, verify they own this order
    if user["role"] == UserRole.SELLER.value:
        seller_items = [i for i in order["items"] if i["seller_id"] == user["id"]]
        if not seller_items:
            raise HTTPException(status_code=403, detail="Not authorized")
    
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
    
    # Create commission record for the seller
    for seller_id in set(item["seller_id"] for item in order["items"]):
        seller_total = sum(item["total"] for item in order["items"] if item["seller_id"] == seller_id)
        commission_amount = round(seller_total * COMMISSION_RATE, 2)
        due_date = datetime.now(timezone.utc) + timedelta(hours=COMMISSION_DUE_HOURS)
        
        commission_record = {
            "id": str(uuid.uuid4()),
            "order_id": order["id"],
            "order_number": order["order_number"],
            "seller_id": seller_id,
            "sale_amount": seller_total,
            "commission_amount": commission_amount,
            "commission_rate": COMMISSION_RATE,
            "status": CommissionStatus.PENDING.value,
            "due_date": due_date.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.commissions.insert_one(commission_record)
    
    return {"message": "Payment confirmed"}

@api_router.post("/payments/{payment_id}/reject")
async def reject_payment(payment_id: str, user: dict = Depends(get_current_user)):
    """Admin or Seller rejects a payment"""
    if user["role"] not in [UserRole.ADMIN.value, UserRole.SELLER.value]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await db.payments.update_one({"id": payment_id}, {"$set": {"status": "rejected"}})
    await db.orders.update_one(
        {"id": payment["order_id"]},
        {
            "$set": {"payment_status": PaymentStatus.FAILED.value},
            "$push": {"tracking_info": {
                "status": "Payment Rejected",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "note": "Payment verification failed. Please upload a valid receipt."
            }}
        }
    )
    
    return {"message": "Payment rejected"}

# ======================== COMMISSION ROUTES ========================
@api_router.get("/commissions")
async def get_commissions(user: dict = Depends(get_current_user)):
    """Get commissions - sellers see their own, admin sees all"""
    if user["role"] == UserRole.ADMIN.value:
        commissions = await db.commissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    elif user["role"] == UserRole.SELLER.value:
        commissions = await db.commissions.find(
            {"seller_id": user["id"]}, {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update overdue status
    now = datetime.now(timezone.utc)
    for c in commissions:
        if c["status"] == CommissionStatus.PENDING.value:
            due_date = datetime.fromisoformat(c["due_date"].replace("Z", "+00:00"))
            if now > due_date:
                c["status"] = CommissionStatus.OVERDUE.value
                await db.commissions.update_one(
                    {"id": c["id"]},
                    {"$set": {"status": CommissionStatus.OVERDUE.value}}
                )
    
    return commissions

@api_router.get("/commissions/stats")
async def get_commission_stats(user: dict = Depends(get_current_user)):
    """Get commission statistics"""
    if user["role"] == UserRole.ADMIN.value:
        total_earned = 0
        pending_amount = 0
        commissions = await db.commissions.find({}, {"_id": 0}).to_list(10000)
        for c in commissions:
            if c["status"] == CommissionStatus.PAID.value:
                total_earned += c["commission_amount"]
            elif c["status"] in [CommissionStatus.PENDING.value, CommissionStatus.OVERDUE.value]:
                pending_amount += c["commission_amount"]
        return {
            "total_earned": total_earned,
            "pending_amount": pending_amount,
            "total_commissions": len(commissions)
        }
    elif user["role"] == UserRole.SELLER.value:
        total_owed = 0
        paid_amount = 0
        commissions = await db.commissions.find({"seller_id": user["id"]}, {"_id": 0}).to_list(10000)
        for c in commissions:
            if c["status"] == CommissionStatus.PAID.value:
                paid_amount += c["commission_amount"]
            elif c["status"] in [CommissionStatus.PENDING.value, CommissionStatus.OVERDUE.value]:
                total_owed += c["commission_amount"]
        return {
            "total_owed": total_owed,
            "paid_amount": paid_amount,
            "total_commissions": len(commissions)
        }
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

@api_router.post("/commissions/{commission_id}/pay")
async def pay_commission(commission_id: str, payment: CommissionPayment, user: dict = Depends(get_current_user)):
    """Seller submits commission payment"""
    if user["role"] not in [UserRole.SELLER.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    commission = await db.commissions.find_one({"id": commission_id}, {"_id": 0})
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    
    if user["role"] == UserRole.SELLER.value and commission["seller_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create commission payment record
    commission_payment = {
        "id": str(uuid.uuid4()),
        "commission_id": commission_id,
        "seller_id": commission["seller_id"],
        "amount": commission["commission_amount"],
        "transaction_ref": payment.transaction_ref,
        "receipt_image": payment.receipt_image,
        "status": "pending_review",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.commission_payments.insert_one(commission_payment)
    
    await db.commissions.update_one(
        {"id": commission_id},
        {"$set": {"status": CommissionStatus.PENDING_VERIFICATION.value}}
    )
    
    return {"message": "Commission payment submitted", "payment_id": commission_payment["id"]}

@api_router.get("/commissions/payments/pending")
async def get_pending_commission_payments(user: dict = Depends(get_current_user)):
    """Admin gets pending commission payments"""
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    payments = await db.commission_payments.find({"status": "pending_review"}, {"_id": 0}).to_list(100)
    
    for p in payments:
        commission = await db.commissions.find_one({"id": p["commission_id"]}, {"_id": 0})
        if commission:
            p["order_number"] = commission["order_number"]
            p["commission_amount"] = commission["commission_amount"]
        seller = await db.users.find_one({"id": p["seller_id"]}, {"_id": 0, "password": 0})
        if seller:
            p["seller_name"] = seller.get("business_name") or seller["name"]
    
    return payments

@api_router.post("/commissions/payments/{payment_id}/confirm")
async def confirm_commission_payment(payment_id: str, user: dict = Depends(get_current_user)):
    """Admin confirms commission payment"""
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    payment = await db.commission_payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await db.commission_payments.update_one({"id": payment_id}, {"$set": {"status": "confirmed"}})
    await db.commissions.update_one(
        {"id": payment["commission_id"]},
        {"$set": {"status": CommissionStatus.PAID.value, "paid_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Commission payment confirmed"}

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
    pending_commissions = await db.commission_payments.count_documents({"status": "pending_review"})
    
    completed_orders = await db.orders.find({"payment_status": PaymentStatus.COMPLETED.value}, {"_id": 0}).to_list(10000)
    total_sales = sum(o["total_amount"] for o in completed_orders)
    
    commissions = await db.commissions.find({}, {"_id": 0}).to_list(10000)
    total_commission_earned = sum(c["commission_amount"] for c in commissions if c["status"] == CommissionStatus.PAID.value)
    pending_commission_amount = sum(c["commission_amount"] for c in commissions if c["status"] in [CommissionStatus.PENDING.value, CommissionStatus.OVERDUE.value, CommissionStatus.PENDING_VERIFICATION.value])
    
    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "pending_payments": pending_payments,
        "pending_commissions": pending_commissions,
        "total_sales": total_sales,
        "total_commission_earned": total_commission_earned,
        "pending_commission_amount": pending_commission_amount
    }

@api_router.get("/admin/commission-payment-method")
async def get_admin_commission_payment_method(user: dict = Depends(get_current_user)):
    """Get admin's preferred payment method for commission collection"""
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    setting = await db.settings.find_one({"key": "commission_payment_method"}, {"_id": 0})
    return setting or {"payment_method_id": None}

@api_router.post("/admin/commission-payment-method")
async def set_admin_commission_payment_method(data: dict, user: dict = Depends(get_current_user)):
    """Admin sets preferred payment method for commission collection"""
    if user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    
    await db.settings.update_one(
        {"key": "commission_payment_method"},
        {"$set": {
            "key": "commission_payment_method",
            "payment_method_id": data.get("payment_method_id"),
            "account_name": data.get("account_name"),
            "account_number": data.get("account_number"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": "Commission payment method updated"}

@api_router.get("/admin/commission-payment-info")
async def get_commission_payment_info():
    """Public endpoint for sellers to see where to pay commission"""
    setting = await db.settings.find_one({"key": "commission_payment_method"}, {"_id": 0})
    if not setting or not setting.get("payment_method_id"):
        return {"message": "Commission payment method not set"}
    
    method = await db.payment_methods.find_one({"id": setting["payment_method_id"]}, {"_id": 0})
    if not method:
        return {"message": "Payment method not found"}
    
    return {
        "method_name": method["name"],
        "method_type": method["type"],
        "logo_url": method.get("logo_url"),
        "account_name": setting.get("account_name"),
        "account_number": setting.get("account_number"),
        "instructions": method.get("instructions")
    }

# ======================== SELLER ROUTES ========================
@api_router.get("/seller/stats")
async def get_seller_stats(user: dict = Depends(get_current_user)):
    if user["role"] not in [UserRole.SELLER.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Sellers only")
    
    total_products = await db.products.count_documents({"seller_id": user["id"]})
    orders = await db.orders.find({"items.seller_id": user["id"]}, {"_id": 0}).to_list(10000)
    
    total_orders = len(orders)
    total_sales = sum(
        sum(item["total"] for item in o["items"] if item["seller_id"] == user["id"])
        for o in orders if o["payment_status"] == PaymentStatus.COMPLETED.value
    )
    
    commissions = await db.commissions.find({"seller_id": user["id"]}, {"_id": 0}).to_list(10000)
    pending_commission = sum(c["commission_amount"] for c in commissions if c["status"] in [CommissionStatus.PENDING.value, CommissionStatus.OVERDUE.value])
    paid_commission = sum(c["commission_amount"] for c in commissions if c["status"] == CommissionStatus.PAID.value)
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_sales": total_sales,
        "pending_commission": pending_commission,
        "paid_commission": paid_commission
    }

# ======================== SEED DATA ========================
@api_router.post("/seed")
async def seed_data():
    existing_categories = await db.categories.count_documents({})
    if existing_categories > 0:
        return {"message": "Already seeded"}
    
    # Create payment methods (Top 10 Ethiopian payment methods)
    payment_methods = [
        {"id": str(uuid.uuid4()), "name": "Telebirr", "type": "mobile_money", "account_name": "Etho Parts", "account_number": "0777770757", "instructions": "Send money to the account number and upload receipt", "logo_url": "https://play-lh.googleusercontent.com/Wd2GI4hYd_4TdNjqTFVW0xqEUY5PmKv5YfPx2CpFo7vAQwRxuLcZGQ1EIQ7v7xVBcg=w240-h480-rw", "enabled": True},
        {"id": str(uuid.uuid4()), "name": "CBE Birr", "type": "mobile_money", "account_name": "Etho Parts", "account_number": "1000123456789", "instructions": "Transfer to CBE Birr account", "logo_url": "https://play-lh.googleusercontent.com/7DkVqhvGxGK3qNAIwvYhKPHzHqQoH8rq2E_5jy5TRzp0lBZ_8eT4vYuV8dF9HUv2FA=w240-h480-rw", "enabled": True},
        {"id": str(uuid.uuid4()), "name": "Amole", "type": "mobile_money", "account_name": "Etho Parts", "account_number": "0911223344", "instructions": "Send via Amole app", "logo_url": "https://play-lh.googleusercontent.com/mGAE8LVnP9hfPXR5jJ3yQ5hY9mQP8OqGJ0fvH7RdyJKE8SXPdXH7h1rNg4EVgzU=w240-h480-rw", "enabled": True},
        {"id": str(uuid.uuid4()), "name": "M-Birr", "type": "mobile_money", "account_name": "Etho Parts", "account_number": "0922334455", "instructions": "Transfer via M-Birr", "logo_url": "https://play-lh.googleusercontent.com/V4KvQMGgE8RvGqhJx3bWEgGHkxFp4hFLUqGOFdGJG7OqNMp7wE9j7hSGQ2Z5FPvRvg=w240-h480-rw", "enabled": True},
        {"id": str(uuid.uuid4()), "name": "HelloCash", "type": "mobile_money", "account_name": "Etho Parts", "account_number": "0933445566", "instructions": "Pay via HelloCash", "logo_url": "https://play-lh.googleusercontent.com/aOQRhXwvQKCvBJxhJxR7l_KJwA6qJlP7JhR5sYHl7qO8nG1PdD4xA6kQV8nJ4hLQqg=w240-h480-rw", "enabled": True},
        {"id": str(uuid.uuid4()), "name": "Commercial Bank of Ethiopia (CBE)", "type": "bank", "account_name": "Etho Parts PLC", "account_number": "1000987654321", "instructions": "Bank transfer to CBE account", "logo_url": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a8/Commercial_Bank_of_Ethiopia_Logo.svg/200px-Commercial_Bank_of_Ethiopia_Logo.svg.png", "enabled": True},
        {"id": str(uuid.uuid4()), "name": "Awash Bank", "type": "bank", "account_name": "Etho Parts PLC", "account_number": "01234567890123", "instructions": "Transfer to Awash Bank account", "logo_url": "https://awashbank.com/wp-content/uploads/2021/04/awash-bank-logo.png", "enabled": True},
        {"id": str(uuid.uuid4()), "name": "Dashen Bank", "type": "bank", "account_name": "Etho Parts PLC", "account_number": "0123456789012", "instructions": "Transfer to Dashen Bank account", "logo_url": "https://dashenbank.com/wp-content/uploads/2020/01/dashen-bank-logo.png", "enabled": True},
        {"id": str(uuid.uuid4()), "name": "Bank of Abyssinia", "type": "bank", "account_name": "Etho Parts PLC", "account_number": "98765432101234", "instructions": "Transfer to BOA account", "logo_url": "https://www.bankofabyssinia.com/wp-content/uploads/2020/01/boa-logo.png", "enabled": True},
        {"id": str(uuid.uuid4()), "name": "Wegagen Bank", "type": "bank", "account_name": "Etho Parts PLC", "account_number": "0567891234567", "instructions": "Transfer to Wegagen Bank account", "logo_url": "https://wegagenbanksc.com/wp-content/uploads/2020/01/wegagen-logo.png", "enabled": True},
    ]
    
    for pm in payment_methods:
        pm["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.payment_methods.insert_many(payment_methods)
    
    # Set default admin commission payment method (Telebirr)
    await db.settings.update_one(
        {"key": "commission_payment_method"},
        {"$set": {
            "key": "commission_payment_method",
            "payment_method_id": payment_methods[0]["id"],
            "account_name": "Etho Parts Admin",
            "account_number": "0777770757",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
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
        "enabled_payment_methods": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_user)
    
    # Create sample seller with payment methods
    seller_user = {
        "id": str(uuid.uuid4()),
        "email": "seller@ethoparts.com",
        "password": hash_password("seller123"),
        "name": "Auto Parts Dealer",
        "phone": "0911223344",
        "role": UserRole.SELLER.value,
        "business_name": "Addis Auto Parts",
        "address": "Merkato, Addis Ababa",
        "enabled_payment_methods": [payment_methods[0]["id"], payment_methods[5]["id"]],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(seller_user)
    
    # Add seller payment methods
    seller_payment_methods = [
        {
            "id": str(uuid.uuid4()),
            "seller_id": seller_user["id"],
            "payment_method_id": payment_methods[0]["id"],  # Telebirr
            "account_name": "Addis Auto Parts",
            "account_number": "0911223344",
            "enabled": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "seller_id": seller_user["id"],
            "payment_method_id": payment_methods[5]["id"],  # CBE
            "account_name": "Addis Auto Parts PLC",
            "account_number": "1000567891234",
            "enabled": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.seller_payment_methods.insert_many(seller_payment_methods)
    
    # Create sample products
    sample_products = [
        {"name": "Toyota Corolla Brake Pads", "description": "High-quality ceramic brake pads for Toyota Corolla 2015-2023.", "price": 2500, "category_id": categories[1]["id"], "brand": "Bosch", "condition": "new", "stock": 25, "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"], "compatible_cars": ["Toyota Corolla", "Toyota Camry"], "seller_id": seller_user["id"]},
        {"name": "Nissan Sunny Air Filter", "description": "OEM quality air filter for Nissan Sunny.", "price": 450, "category_id": categories[5]["id"], "brand": "Mann", "condition": "new", "stock": 50, "images": ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400"], "compatible_cars": ["Nissan Sunny", "Nissan Almera"], "seller_id": seller_user["id"]},
        {"name": "Universal LED Headlight Bulbs", "description": "6000K bright white LED headlight bulbs.", "price": 1200, "category_id": categories[6]["id"], "brand": "Philips", "condition": "new", "stock": 100, "images": ["https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400"], "compatible_cars": ["Universal"], "seller_id": seller_user["id"]},
        {"name": "Suzuki Swift Alternator", "description": "Remanufactured alternator for Suzuki Swift 2010-2020.", "price": 8500, "category_id": categories[3]["id"], "brand": "Denso", "condition": "refurbished", "stock": 8, "images": ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400"], "compatible_cars": ["Suzuki Swift", "Suzuki Dzire"], "seller_id": seller_user["id"]},
        {"name": "Hyundai Accent Shock Absorbers", "description": "Front shock absorbers set for Hyundai Accent.", "price": 4200, "category_id": categories[2]["id"], "brand": "KYB", "condition": "new", "stock": 15, "images": ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400"], "compatible_cars": ["Hyundai Accent", "Hyundai Verna"], "seller_id": seller_user["id"]},
        {"name": "Toyota Hilux Oil Filter", "description": "Genuine oil filter for Toyota Hilux diesel engines.", "price": 350, "category_id": categories[5]["id"], "brand": "Toyota", "condition": "new", "stock": 75, "images": ["https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400"], "compatible_cars": ["Toyota Hilux", "Toyota Fortuner"], "seller_id": seller_user["id"]},
        {"name": "Side Mirror (Left) - Universal", "description": "Universal fit left side mirror.", "price": 650, "category_id": categories[4]["id"], "brand": "Generic", "condition": "new", "stock": 30, "images": ["https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400"], "compatible_cars": ["Universal"], "seller_id": seller_user["id"]},
        {"name": "Car Battery 12V 60Ah", "description": "Maintenance-free car battery.", "price": 5500, "category_id": categories[3]["id"], "brand": "Exide", "condition": "new", "stock": 20, "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"], "compatible_cars": ["Universal"], "seller_id": seller_user["id"]},
        {"name": "Timing Belt Kit - Toyota", "description": "Complete timing belt kit for Toyota 1.6L-2.0L engines.", "price": 3800, "category_id": categories[0]["id"], "brand": "Gates", "condition": "new", "stock": 12, "images": ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400"], "compatible_cars": ["Toyota Corolla", "Toyota Yaris"], "seller_id": seller_user["id"]},
        {"name": "Isuzu D-Max Clutch Kit", "description": "Complete clutch kit for Isuzu D-Max.", "price": 7200, "category_id": categories[0]["id"], "brand": "Valeo", "condition": "new", "stock": 6, "images": ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400"], "compatible_cars": ["Isuzu D-Max", "Isuzu MU-X"], "seller_id": seller_user["id"]},
        {"name": "Spark Plugs Set (4pcs)", "description": "Iridium spark plugs for better ignition.", "price": 1600, "category_id": categories[0]["id"], "brand": "NGK", "condition": "new", "stock": 40, "images": ["https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400"], "compatible_cars": ["Universal"], "seller_id": seller_user["id"]},
        {"name": "Radiator - Honda Civic", "description": "Aluminum radiator for Honda Civic 2006-2011.", "price": 4500, "category_id": categories[0]["id"], "brand": "Denso", "condition": "new", "stock": 10, "images": ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400"], "compatible_cars": ["Honda Civic", "Honda City"], "seller_id": seller_user["id"]},
    ]
    
    for product in sample_products:
        product["id"] = str(uuid.uuid4())
        product["avg_rating"] = round(3.5 + (hash(product["name"]) % 15) / 10, 1)
        product["review_count"] = hash(product["name"]) % 20
        product["created_at"] = datetime.now(timezone.utc).isoformat()
        product["specifications"] = None
    
    await db.products.insert_many(sample_products)
    
    return {"message": "Data seeded successfully", "categories": len(categories), "products": len(sample_products), "payment_methods": len(payment_methods)}

@api_router.get("/")
async def root():
    return {"message": "Etho Parts API", "version": "2.0.0"}

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
