from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import random
import logging
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta, date
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# -------- Mongo --------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"

app = FastAPI(title="GymPro API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# -------- Helpers --------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_token(user_id: str, gym_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "gym_id": gym_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# -------- Models --------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    gymName: str
    ownerName: str
    phone: str
    address: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class GymUpdate(BaseModel):
    name: Optional[str] = None
    ownerName: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    logoUrl: Optional[str] = None
    gstNumber: Optional[str] = None
    plan: Optional[str] = None
    workingHoursOpen: Optional[str] = None
    workingHoursClose: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None

class MemberIn(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    gender: str = "MALE"
    dateOfBirth: Optional[str] = ""
    address: Optional[str] = ""
    photoUrl: Optional[str] = ""
    membershipType: str
    membershipFee: float
    joinDate: str
    expiryDate: str
    status: str = "ACTIVE"
    trainerId: Optional[str] = ""
    height: Optional[float] = None
    weight: Optional[float] = None
    goal: Optional[str] = ""
    emergencyContact: Optional[str] = ""
    emergencyPhone: Optional[str] = ""
    notes: Optional[str] = ""

class AttendanceIn(BaseModel):
    memberId: str
    date: str
    checkIn: Optional[str] = None
    checkOut: Optional[str] = None

class PaymentIn(BaseModel):
    memberId: str
    amount: float
    method: str = "CASH"
    status: str = "PAID"
    description: Optional[str] = ""
    paidAt: Optional[str] = None
    dueDate: Optional[str] = None

class LeadIn(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    source: str
    interest: Optional[str] = ""
    status: str = "NEW"
    followUpDate: Optional[str] = ""
    notes: Optional[str] = ""

class TrainerIn(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    photoUrl: Optional[str] = ""
    speciality: str
    salary: float = 0
    joinDate: Optional[str] = None
    isActive: bool = True

class ExpenseIn(BaseModel):
    category: str
    amount: float
    description: Optional[str] = ""
    date: str

class PlanIn(BaseModel):
    name: str
    durationDays: int
    price: float
    isActive: bool = True

class ClassIn(BaseModel):
    name: str
    type: str
    trainerId: Optional[str] = ""
    startTime: str
    endTime: str
    days: List[str]
    capacity: int = 20

# -------- Auth --------
@api.post("/auth/register")
async def register(data: RegisterIn):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    gym_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    gym = {
        "id": gym_id,
        "name": data.gymName,
        "ownerName": data.ownerName,
        "phone": data.phone,
        "email": data.email.lower(),
        "address": data.address,
        "city": data.city,
        "state": data.state,
        "pincode": data.pincode,
        "logoUrl": "",
        "gstNumber": "",
        "plan": "GROWTH",
        "workingHoursOpen": "06:00",
        "workingHoursClose": "22:00",
        "instagram": "",
        "facebook": "",
        "createdAt": now_iso(),
    }
    user = {
        "id": user_id,
        "gym_id": gym_id,
        "name": data.name,
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "role": "owner",
        "createdAt": now_iso(),
    }
    await db.gyms.insert_one(gym)
    await db.users.insert_one(user)
    # default plans
    default_plans = [
        {"id": str(uuid.uuid4()), "gym_id": gym_id, "name": "Monthly", "durationDays": 30, "price": 999, "isActive": True},
        {"id": str(uuid.uuid4()), "gym_id": gym_id, "name": "Quarterly", "durationDays": 90, "price": 2499, "isActive": True},
        {"id": str(uuid.uuid4()), "gym_id": gym_id, "name": "Annual", "durationDays": 365, "price": 7999, "isActive": True},
        {"id": str(uuid.uuid4()), "gym_id": gym_id, "name": "Student", "durationDays": 30, "price": 699, "isActive": True},
    ]
    await db.plans.insert_many(default_plans)
    token = create_token(user_id, gym_id, data.email.lower())
    gym.pop("_id", None)
    return {"token": token, "user": {"id": user_id, "name": data.name, "email": data.email.lower(), "gym_id": gym_id}, "gym": gym}

@api.post("/auth/login")
async def login(data: LoginIn):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ya password galat hai")
    token = create_token(user["id"], user["gym_id"], user["email"])
    gym = await db.gyms.find_one({"id": user["gym_id"]}, {"_id": 0})
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "gym_id": user["gym_id"]},
        "gym": gym,
    }

@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    gym = await db.gyms.find_one({"id": user["gym_id"]}, {"_id": 0})
    return {"user": user, "gym": gym}

@api.post("/auth/logout")
async def logout(user=Depends(get_current_user)):
    return {"ok": True}

# -------- Gym Profile --------
@api.get("/gym")
async def get_gym(user=Depends(get_current_user)):
    gym = await db.gyms.find_one({"id": user["gym_id"]}, {"_id": 0})
    return gym

@api.put("/gym")
async def update_gym(data: GymUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if update:
        await db.gyms.update_one({"id": user["gym_id"]}, {"$set": update})
    gym = await db.gyms.find_one({"id": user["gym_id"]}, {"_id": 0})
    return gym

# -------- Plans --------
@api.get("/plans")
async def list_plans(user=Depends(get_current_user)):
    plans = await db.plans.find({"gym_id": user["gym_id"]}, {"_id": 0}).to_list(500)
    return plans

@api.post("/plans")
async def create_plan(data: PlanIn, user=Depends(get_current_user)):
    plan = {"id": str(uuid.uuid4()), "gym_id": user["gym_id"], **data.model_dump()}
    await db.plans.insert_one(plan)
    plan.pop("_id", None)
    return plan

@api.put("/plans/{plan_id}")
async def update_plan(plan_id: str, data: PlanIn, user=Depends(get_current_user)):
    await db.plans.update_one({"id": plan_id, "gym_id": user["gym_id"]}, {"$set": data.model_dump()})
    return await db.plans.find_one({"id": plan_id}, {"_id": 0})

@api.delete("/plans/{plan_id}")
async def delete_plan(plan_id: str, user=Depends(get_current_user)):
    await db.plans.delete_one({"id": plan_id, "gym_id": user["gym_id"]})
    return {"ok": True}

# -------- Members --------
async def _next_member_id(gym_id: str) -> str:
    count = await db.members.count_documents({"gym_id": gym_id})
    yr = datetime.now().year
    return f"GYM-{yr}-{str(count + 1).zfill(3)}"

@api.get("/members")
async def list_members(user=Depends(get_current_user)):
    members = await db.members.find({"gym_id": user["gym_id"]}, {"_id": 0}).sort("createdAt", -1).to_list(5000)
    return members

@api.get("/members/{member_id}")
async def get_member(member_id: str, user=Depends(get_current_user)):
    m = await db.members.find_one({"id": member_id, "gym_id": user["gym_id"]}, {"_id": 0})
    if not m:
        raise HTTPException(404, "Member not found")
    return m

@api.post("/members")
async def create_member(data: MemberIn, user=Depends(get_current_user)):
    mid = str(uuid.uuid4())
    member = {
        "id": mid,
        "gym_id": user["gym_id"],
        "membershipId": await _next_member_id(user["gym_id"]),
        **data.model_dump(),
        "createdAt": now_iso(),
    }
    await db.members.insert_one(member)
    member.pop("_id", None)
    return member

@api.put("/members/{member_id}")
async def update_member(member_id: str, data: MemberIn, user=Depends(get_current_user)):
    await db.members.update_one({"id": member_id, "gym_id": user["gym_id"]}, {"$set": data.model_dump()})
    return await db.members.find_one({"id": member_id}, {"_id": 0})

@api.delete("/members/{member_id}")
async def delete_member(member_id: str, user=Depends(get_current_user)):
    await db.members.delete_one({"id": member_id, "gym_id": user["gym_id"]})
    return {"ok": True}

# -------- Attendance --------
@api.get("/attendance")
async def list_attendance(user=Depends(get_current_user), date: Optional[str] = None, memberId: Optional[str] = None):
    q = {"gym_id": user["gym_id"]}
    if date:
        q["date"] = date
    if memberId:
        q["memberId"] = memberId
    items = await db.attendance.find(q, {"_id": 0}).sort("date", -1).to_list(10000)
    return items

@api.post("/attendance")
async def mark_attendance(data: AttendanceIn, user=Depends(get_current_user)):
    member = await db.members.find_one({"id": data.memberId, "gym_id": user["gym_id"]}, {"_id": 0})
    if not member:
        raise HTTPException(404, "Member not found")
    existing = await db.attendance.find_one({"gym_id": user["gym_id"], "memberId": data.memberId, "date": data.date}, {"_id": 0})
    if existing:
        return existing
    rec = {
        "id": str(uuid.uuid4()),
        "gym_id": user["gym_id"],
        "memberId": data.memberId,
        "memberName": member["name"],
        "date": data.date,
        "checkIn": data.checkIn or datetime.now().strftime("%H:%M"),
        "checkOut": data.checkOut,
    }
    await db.attendance.insert_one(rec)
    rec.pop("_id", None)
    return rec

@api.delete("/attendance/{att_id}")
async def delete_attendance(att_id: str, user=Depends(get_current_user)):
    await db.attendance.delete_one({"id": att_id, "gym_id": user["gym_id"]})
    return {"ok": True}

# -------- Payments --------
async def _next_invoice_no(gym_id: str) -> str:
    count = await db.payments.count_documents({"gym_id": gym_id})
    yr = datetime.now().year
    return f"INV-{yr}-{str(count + 1).zfill(4)}"

@api.get("/payments")
async def list_payments(user=Depends(get_current_user)):
    items = await db.payments.find({"gym_id": user["gym_id"]}, {"_id": 0}).sort("paidAt", -1).to_list(10000)
    return items

@api.post("/payments")
async def create_payment(data: PaymentIn, user=Depends(get_current_user)):
    member = await db.members.find_one({"id": data.memberId, "gym_id": user["gym_id"]}, {"_id": 0})
    if not member:
        raise HTTPException(404, "Member not found")
    rec = {
        "id": str(uuid.uuid4()),
        "gym_id": user["gym_id"],
        "invoiceNo": await _next_invoice_no(user["gym_id"]),
        "memberId": data.memberId,
        "memberName": member["name"],
        "memberPhone": member["phone"],
        "amount": data.amount,
        "method": data.method,
        "status": data.status,
        "description": data.description or "",
        "paidAt": data.paidAt or now_iso(),
        "dueDate": data.dueDate,
    }
    await db.payments.insert_one(rec)
    rec.pop("_id", None)
    # extend membership if PAID and description suggests renewal
    if data.status == "PAID":
        plan = await db.plans.find_one({"gym_id": user["gym_id"], "name": member.get("membershipType")}, {"_id": 0})
        if plan:
            try:
                cur_expiry = datetime.fromisoformat(member["expiryDate"]).date()
            except Exception:
                cur_expiry = date.today()
            base = max(cur_expiry, date.today())
            new_expiry = base + timedelta(days=plan["durationDays"])
            await db.members.update_one(
                {"id": data.memberId},
                {"$set": {"expiryDate": new_expiry.isoformat(), "status": "ACTIVE"}},
            )
    return rec

@api.put("/payments/{pay_id}")
async def update_payment(pay_id: str, data: PaymentIn, user=Depends(get_current_user)):
    await db.payments.update_one({"id": pay_id, "gym_id": user["gym_id"]}, {"$set": data.model_dump()})
    return await db.payments.find_one({"id": pay_id}, {"_id": 0})

@api.delete("/payments/{pay_id}")
async def delete_payment(pay_id: str, user=Depends(get_current_user)):
    await db.payments.delete_one({"id": pay_id, "gym_id": user["gym_id"]})
    return {"ok": True}

# -------- Leads --------
@api.get("/leads")
async def list_leads(user=Depends(get_current_user)):
    return await db.leads.find({"gym_id": user["gym_id"]}, {"_id": 0}).sort("createdAt", -1).to_list(5000)

@api.post("/leads")
async def create_lead(data: LeadIn, user=Depends(get_current_user)):
    rec = {"id": str(uuid.uuid4()), "gym_id": user["gym_id"], **data.model_dump(), "createdAt": now_iso()}
    await db.leads.insert_one(rec)
    rec.pop("_id", None)
    return rec

@api.put("/leads/{lead_id}")
async def update_lead(lead_id: str, data: LeadIn, user=Depends(get_current_user)):
    await db.leads.update_one({"id": lead_id, "gym_id": user["gym_id"]}, {"$set": data.model_dump()})
    return await db.leads.find_one({"id": lead_id}, {"_id": 0})

@api.patch("/leads/{lead_id}/status")
async def patch_lead_status(lead_id: str, body: Dict[str, str], user=Depends(get_current_user)):
    status = body.get("status")
    if not status:
        raise HTTPException(400, "status required")
    await db.leads.update_one({"id": lead_id, "gym_id": user["gym_id"]}, {"$set": {"status": status}})
    return await db.leads.find_one({"id": lead_id}, {"_id": 0})

@api.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user=Depends(get_current_user)):
    await db.leads.delete_one({"id": lead_id, "gym_id": user["gym_id"]})
    return {"ok": True}

# -------- Trainers --------
@api.get("/trainers")
async def list_trainers(user=Depends(get_current_user)):
    return await db.trainers.find({"gym_id": user["gym_id"]}, {"_id": 0}).to_list(500)

@api.post("/trainers")
async def create_trainer(data: TrainerIn, user=Depends(get_current_user)):
    rec = {"id": str(uuid.uuid4()), "gym_id": user["gym_id"], **data.model_dump(), "joinDate": data.joinDate or date.today().isoformat()}
    await db.trainers.insert_one(rec)
    rec.pop("_id", None)
    return rec

@api.put("/trainers/{tid}")
async def update_trainer(tid: str, data: TrainerIn, user=Depends(get_current_user)):
    await db.trainers.update_one({"id": tid, "gym_id": user["gym_id"]}, {"$set": data.model_dump()})
    return await db.trainers.find_one({"id": tid}, {"_id": 0})

@api.delete("/trainers/{tid}")
async def delete_trainer(tid: str, user=Depends(get_current_user)):
    await db.trainers.delete_one({"id": tid, "gym_id": user["gym_id"]})
    return {"ok": True}

# -------- Expenses --------
@api.get("/expenses")
async def list_expenses(user=Depends(get_current_user)):
    return await db.expenses.find({"gym_id": user["gym_id"]}, {"_id": 0}).sort("date", -1).to_list(5000)

@api.post("/expenses")
async def create_expense(data: ExpenseIn, user=Depends(get_current_user)):
    rec = {"id": str(uuid.uuid4()), "gym_id": user["gym_id"], **data.model_dump()}
    await db.expenses.insert_one(rec)
    rec.pop("_id", None)
    return rec

@api.put("/expenses/{eid}")
async def update_expense(eid: str, data: ExpenseIn, user=Depends(get_current_user)):
    await db.expenses.update_one({"id": eid, "gym_id": user["gym_id"]}, {"$set": data.model_dump()})
    return await db.expenses.find_one({"id": eid}, {"_id": 0})

@api.delete("/expenses/{eid}")
async def delete_expense(eid: str, user=Depends(get_current_user)):
    await db.expenses.delete_one({"id": eid, "gym_id": user["gym_id"]})
    return {"ok": True}

# -------- Classes --------
@api.get("/classes")
async def list_classes(user=Depends(get_current_user)):
    return await db.classes.find({"gym_id": user["gym_id"]}, {"_id": 0}).to_list(500)

@api.post("/classes")
async def create_class(data: ClassIn, user=Depends(get_current_user)):
    rec = {"id": str(uuid.uuid4()), "gym_id": user["gym_id"], **data.model_dump()}
    await db.classes.insert_one(rec)
    rec.pop("_id", None)
    return rec

@api.put("/classes/{cid}")
async def update_class(cid: str, data: ClassIn, user=Depends(get_current_user)):
    await db.classes.update_one({"id": cid, "gym_id": user["gym_id"]}, {"$set": data.model_dump()})
    return await db.classes.find_one({"id": cid}, {"_id": 0})

@api.delete("/classes/{cid}")
async def delete_class(cid: str, user=Depends(get_current_user)):
    await db.classes.delete_one({"id": cid, "gym_id": user["gym_id"]})
    return {"ok": True}

# -------- Dashboard stats --------
@api.get("/dashboard/stats")
async def dashboard_stats(user=Depends(get_current_user)):
    gid = user["gym_id"]
    today = date.today()
    soon = today + timedelta(days=7)

    members = await db.members.find({"gym_id": gid}, {"_id": 0}).to_list(10000)
    payments = await db.payments.find({"gym_id": gid}, {"_id": 0}).to_list(10000)
    attendance = await db.attendance.find({"gym_id": gid}, {"_id": 0}).to_list(10000)

    active = [m for m in members if m.get("status") == "ACTIVE"]
    expiring = []
    for m in members:
        try:
            exp = datetime.fromisoformat(m["expiryDate"]).date()
            d = (exp - today).days
            if 0 <= d <= 7 and m.get("status") == "ACTIVE":
                expiring.append({**m, "daysLeft": d})
        except Exception:
            pass

    cur_month = today.strftime("%Y-%m")
    month_revenue = sum(
        p["amount"] for p in payments
        if p.get("status") == "PAID" and p.get("paidAt", "").startswith(cur_month)
    )

    today_str = today.isoformat()
    today_attendance = [a for a in attendance if a.get("date") == today_str]

    # last 6 months revenue (calendar-aware)
    def _month_offset(base: date, k: int) -> date:
        y = base.year
        m = base.month - k
        while m <= 0:
            m += 12
            y -= 1
        return date(y, m, 1)

    rev_chart = []
    for i in range(5, -1, -1):
        d = _month_offset(today, i)
        ym = d.strftime("%Y-%m")
        amt = sum(p["amount"] for p in payments if p.get("status") == "PAID" and p.get("paidAt", "").startswith(ym))
        rev_chart.append({"month": d.strftime("%b"), "revenue": amt})

    # plan distribution
    plan_dist: Dict[str, int] = {}
    for m in members:
        if m.get("status") == "ACTIVE":
            plan_dist[m.get("membershipType", "Other")] = plan_dist.get(m.get("membershipType", "Other"), 0) + 1
    frozen = sum(1 for m in members if m.get("status") == "FROZEN")
    if frozen:
        plan_dist["Frozen"] = frozen

    # new members per month
    new_chart = []
    for i in range(5, -1, -1):
        d = _month_offset(today, i)
        ym = d.strftime("%Y-%m")
        cnt = sum(1 for m in members if m.get("joinDate", "").startswith(ym))
        new_chart.append({"month": d.strftime("%b"), "count": cnt})

    # this week attendance
    week_chart = []
    monday = today - timedelta(days=today.weekday())
    days_lbl = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i, lbl in enumerate(days_lbl):
        d = monday + timedelta(days=i)
        cnt = sum(1 for a in attendance if a.get("date") == d.isoformat())
        week_chart.append({"day": lbl, "count": cnt, "isToday": d == today})

    # recent activity
    activity = []
    for p in sorted(payments, key=lambda x: x.get("paidAt", ""), reverse=True)[:5]:
        activity.append({"type": "payment", "text": f"{p['memberName']} ne ₹{int(p['amount'])} pay kiya", "time": p.get("paidAt"), "color": "green"})
    leads = await db.leads.find({"gym_id": gid}, {"_id": 0}).sort("createdAt", -1).to_list(5)
    for l in leads[:3]:
        activity.append({"type": "lead", "text": f"New lead: {l['name']} ({l['source']})", "time": l.get("createdAt"), "color": "blue"})
    activity = sorted(activity, key=lambda x: x.get("time") or "", reverse=True)[:8]

    return {
        "activeMembers": len(active),
        "totalMembers": len(members),
        "monthRevenue": month_revenue,
        "expiringCount": len(expiring),
        "expiring": sorted(expiring, key=lambda x: x["daysLeft"])[:20],
        "todayAttendance": len(today_attendance),
        "revenueChart": rev_chart,
        "planDistribution": [{"name": k, "value": v} for k, v in plan_dist.items()],
        "newMembersChart": new_chart,
        "weekAttendance": week_chart,
        "activity": activity,
    }

# -------- Seed --------
INDIAN_NAMES = [
    "Rohit Kumar", "Priya Singh", "Amit Verma", "Sunita Devi", "Raj Patel",
    "Anjali Mishra", "Deepak Tiwari", "Kavya Rao", "Suresh Pandey", "Pooja Sharma",
    "Manish Yadav", "Simran Kaur", "Arjun Gupta", "Divya Nair", "Rahul Das",
    "Meena Kumari", "Vijay Singh", "Anita Joshi", "Sanjay Kumar", "Rekha Verma",
    "Aakash Sharma", "Preeti Chauhan", "Nitin Mishra", "Swati Pandey", "Ravi Tiwari",
    "Asha Rani", "Gaurav Singh", "Seema Gupta", "Mukesh Yadav", "Geeta Kumari",
    "Praveen Kumar", "Nisha Jain", "Sachin Shukla", "Ritu Agarwal", "Mohan Lal",
    "Sunita Yadav", "Ashish Kumar", "Komal Singh", "Dinesh Verma", "Lakshmi Devi",
    "Harish Sharma", "Madhuri Patel", "Santosh Kumar", "Poonam Rai", "Vinod Tiwari",
]

async def seed_demo():
    # Wipe existing demo data so each fresh deploy is clean
    existing_user = await db.users.find_one({"email": "demo@gympro.in"})
    if existing_user:
        gym_id = existing_user["gym_id"]
    else:
        gym_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        await db.gyms.insert_one({
            "id": gym_id,
            "name": "FitZone Gym",
            "ownerName": "Rahul Sharma",
            "phone": "9876543210",
            "email": "demo@gympro.in",
            "address": "Boring Road, Patna, Bihar - 800001",
            "city": "Patna", "state": "Bihar", "pincode": "800001",
            "logoUrl": "", "gstNumber": "",
            "plan": "GROWTH",
            "workingHoursOpen": "06:00", "workingHoursClose": "22:00",
            "instagram": "", "facebook": "",
            "createdAt": now_iso(),
        })
        await db.users.insert_one({
            "id": user_id, "gym_id": gym_id,
            "name": "Rahul Sharma", "email": "demo@gympro.in",
            "password_hash": hash_password("Demo@123"),
            "role": "owner", "createdAt": now_iso(),
        })

    # idempotent: only seed if no members yet
    if await db.members.count_documents({"gym_id": gym_id}) > 0:
        return

    # plans
    plans = [
        {"id": str(uuid.uuid4()), "gym_id": gym_id, "name": "Monthly", "durationDays": 30, "price": 999, "isActive": True},
        {"id": str(uuid.uuid4()), "gym_id": gym_id, "name": "Quarterly", "durationDays": 90, "price": 2499, "isActive": True},
        {"id": str(uuid.uuid4()), "gym_id": gym_id, "name": "Annual", "durationDays": 365, "price": 7999, "isActive": True},
        {"id": str(uuid.uuid4()), "gym_id": gym_id, "name": "Student", "durationDays": 30, "price": 699, "isActive": True},
    ]
    await db.plans.insert_many([dict(p) for p in plans])

    # trainers
    trainers_data = [
        ("Amit Singh", "Strength Training", 18000),
        ("Priya Verma", "Yoga", 15000),
        ("Rohit Kumar", "Cardio & HIIT", 16000),
        ("Neha Gupta", "Zumba", 14000),
        ("Vikash Yadav", "CrossFit", 17000),
    ]
    trainers = []
    for n, s, sal in trainers_data:
        trainers.append({
            "id": str(uuid.uuid4()), "gym_id": gym_id,
            "name": n, "phone": f"98765{random.randint(10000, 99999)}",
            "email": "", "photoUrl": "",
            "speciality": s, "salary": sal,
            "joinDate": (date.today() - timedelta(days=random.randint(180, 720))).isoformat(),
            "isActive": True,
        })
    await db.trainers.insert_many([dict(t) for t in trainers])

    # members
    today = date.today()
    plans_lookup = {"Monthly": 30, "Quarterly": 90, "Annual": 365, "Student": 30}
    plans_price = {"Monthly": 999, "Quarterly": 2499, "Annual": 7999, "Student": 699}
    members = []
    yr = today.year
    # 30 ACTIVE
    for i in range(30):
        nm = INDIAN_NAMES[i]
        ptype = random.choice(["Monthly", "Quarterly", "Annual", "Student"])
        join_offset = random.randint(10, 300)
        join_d = today - timedelta(days=join_offset)
        # ensure expiry is in future
        exp_d = today + timedelta(days=random.randint(15, plans_lookup[ptype]))
        members.append({
            "id": str(uuid.uuid4()), "gym_id": gym_id,
            "membershipId": f"GYM-{yr}-{str(i + 1).zfill(3)}",
            "name": nm, "phone": f"98765{random.randint(10000, 99999)}",
            "email": "", "gender": random.choice(["MALE", "FEMALE"]),
            "dateOfBirth": "", "address": "",
            "photoUrl": "",
            "membershipType": ptype, "membershipFee": plans_price[ptype],
            "joinDate": join_d.isoformat(), "expiryDate": exp_d.isoformat(),
            "status": "ACTIVE",
            "trainerId": random.choice(trainers)["id"] if random.random() > 0.2 else "",
            "height": random.randint(155, 185), "weight": random.randint(50, 95),
            "goal": random.choice(["Weight Loss", "Muscle Gain", "General Fitness", "Flexibility"]),
            "emergencyContact": "", "emergencyPhone": "", "notes": "",
            "createdAt": (datetime.now(timezone.utc) - timedelta(days=join_offset)).isoformat(),
        })
    # 2 expiring 1-3 days
    for i in range(30, 32):
        nm = INDIAN_NAMES[i]
        members.append({
            "id": str(uuid.uuid4()), "gym_id": gym_id,
            "membershipId": f"GYM-{yr}-{str(i + 1).zfill(3)}",
            "name": nm, "phone": f"98765{random.randint(10000, 99999)}",
            "email": "", "gender": random.choice(["MALE", "FEMALE"]),
            "dateOfBirth": "", "address": "", "photoUrl": "",
            "membershipType": "Monthly", "membershipFee": 999,
            "joinDate": (today - timedelta(days=28)).isoformat(),
            "expiryDate": (today + timedelta(days=random.randint(1, 3))).isoformat(),
            "status": "ACTIVE",
            "trainerId": "", "height": 170, "weight": 70,
            "goal": "General Fitness", "emergencyContact": "", "emergencyPhone": "", "notes": "",
            "createdAt": now_iso(),
        })
    # 3 expiring 4-7 days
    for i in range(32, 35):
        nm = INDIAN_NAMES[i]
        members.append({
            "id": str(uuid.uuid4()), "gym_id": gym_id,
            "membershipId": f"GYM-{yr}-{str(i + 1).zfill(3)}",
            "name": nm, "phone": f"98765{random.randint(10000, 99999)}",
            "email": "", "gender": random.choice(["MALE", "FEMALE"]),
            "dateOfBirth": "", "address": "", "photoUrl": "",
            "membershipType": "Quarterly", "membershipFee": 2499,
            "joinDate": (today - timedelta(days=85)).isoformat(),
            "expiryDate": (today + timedelta(days=random.randint(4, 7))).isoformat(),
            "status": "ACTIVE",
            "trainerId": "", "height": 170, "weight": 70,
            "goal": "Weight Loss", "emergencyContact": "", "emergencyPhone": "", "notes": "",
            "createdAt": now_iso(),
        })
    # 8 EXPIRED
    for i in range(35, 43):
        nm = INDIAN_NAMES[i]
        members.append({
            "id": str(uuid.uuid4()), "gym_id": gym_id,
            "membershipId": f"GYM-{yr}-{str(i + 1).zfill(3)}",
            "name": nm, "phone": f"98765{random.randint(10000, 99999)}",
            "email": "", "gender": random.choice(["MALE", "FEMALE"]),
            "dateOfBirth": "", "address": "", "photoUrl": "",
            "membershipType": "Monthly", "membershipFee": 999,
            "joinDate": (today - timedelta(days=60)).isoformat(),
            "expiryDate": (today - timedelta(days=random.randint(1, 25))).isoformat(),
            "status": "EXPIRED",
            "trainerId": "", "height": 170, "weight": 70,
            "goal": "General Fitness", "emergencyContact": "", "emergencyPhone": "", "notes": "",
            "createdAt": now_iso(),
        })
    # 5 FROZEN
    for i in range(43, 45):
        nm = INDIAN_NAMES[i]
        members.append({
            "id": str(uuid.uuid4()), "gym_id": gym_id,
            "membershipId": f"GYM-{yr}-{str(i + 1).zfill(3)}",
            "name": nm, "phone": f"98765{random.randint(10000, 99999)}",
            "email": "", "gender": random.choice(["MALE", "FEMALE"]),
            "dateOfBirth": "", "address": "", "photoUrl": "",
            "membershipType": "Annual", "membershipFee": 7999,
            "joinDate": (today - timedelta(days=180)).isoformat(),
            "expiryDate": (today + timedelta(days=120)).isoformat(),
            "status": "FROZEN",
            "trainerId": "", "height": 170, "weight": 70,
            "goal": "Muscle Gain", "emergencyContact": "", "emergencyPhone": "", "notes": "",
            "createdAt": now_iso(),
        })
    await db.members.insert_many([dict(m) for m in members])

    # payments — 3 months history
    payments = []
    inv_count = 0
    for month_offset in range(2, -1, -1):
        month_date = (today.replace(day=1) - timedelta(days=month_offset * 30)).replace(day=1)
        # ~25 payments per month
        sample_members = random.sample(members[:40], 25)
        for m in sample_members:
            inv_count += 1
            r = random.random()
            if r < 0.80: status = "PAID"
            elif r < 0.95: status = "PENDING"
            else: status = "OVERDUE"
            mr = random.random()
            if mr < 0.60: method = "CASH"
            elif mr < 0.85: method = "UPI"
            elif mr < 0.95: method = "CARD"
            else: method = "ONLINE"
            day = random.randint(1, 28)
            paid = datetime(month_date.year, month_date.month, day, random.randint(8, 20), random.randint(0, 59), tzinfo=timezone.utc)
            payments.append({
                "id": str(uuid.uuid4()), "gym_id": gym_id,
                "invoiceNo": f"INV-{yr}-{str(inv_count).zfill(4)}",
                "memberId": m["id"], "memberName": m["name"], "memberPhone": m["phone"],
                "amount": m["membershipFee"], "method": method, "status": status,
                "description": f"{m['membershipType']} Membership - {month_date.strftime('%b %Y')}",
                "paidAt": paid.isoformat(),
                "dueDate": None,
            })
    await db.payments.insert_many([dict(p) for p in payments])

    # attendance — last 30 days
    attendance = []
    active_members = [m for m in members if m["status"] == "ACTIVE"]
    for d_off in range(30):
        d = today - timedelta(days=d_off)
        weekday = d.weekday()
        if weekday in (0, 2, 4):
            count = random.randint(28, 34)
        else:
            count = random.randint(18, 28)
        chosen = random.sample(active_members, min(count, len(active_members)))
        for m in chosen:
            h = random.randint(6, 10)
            mn = random.randint(0, 59)
            attendance.append({
                "id": str(uuid.uuid4()), "gym_id": gym_id,
                "memberId": m["id"], "memberName": m["name"],
                "date": d.isoformat(),
                "checkIn": f"{str(h).zfill(2)}:{str(mn).zfill(2)}",
                "checkOut": None,
            })
    await db.attendance.insert_many([dict(a) for a in attendance])

    # leads
    leads_data = [
        ("Ankita Mishra", "9876500001", "INSTAGRAM", "NEW", "Yoga"),
        ("Suresh Pandey", "9876500002", "WALK_IN", "CONTACTED", "Gym"),
        ("Kavya Singh", "9876500003", "REFERRAL", "INTERESTED", "Zumba"),
        ("Deepak Tiwari", "9876500004", "FACEBOOK", "CONVERTED", "Gym"),
        ("Pooja Rani", "9876500005", "GOOGLE", "NEW", "CrossFit"),
        ("Manish Kumar", "9876500006", "WALK_IN", "LOST", "Gym"),
        ("Simran Kaur", "9876500007", "INSTAGRAM", "INTERESTED", "Yoga"),
        ("Arjun Patel", "9876500008", "REFERRAL", "CONTACTED", "Boxing"),
    ]
    leads = []
    for n, ph, src, st, intr in leads_data:
        leads.append({
            "id": str(uuid.uuid4()), "gym_id": gym_id,
            "name": n, "phone": ph, "email": "", "source": src,
            "interest": intr, "status": st,
            "followUpDate": (today + timedelta(days=random.randint(1, 7))).isoformat(),
            "notes": "", "createdAt": now_iso(),
        })
    await db.leads.insert_many([dict(l) for l in leads])

    # expenses last 3 months
    expenses = []
    for month_offset in range(2, -1, -1):
        d = (today.replace(day=1) - timedelta(days=month_offset * 30)).replace(day=1)
        items = [
            ("RENT", 25000, "Monthly rent"),
            ("ELECTRICITY", 7500, "Electricity bill"),
            ("INTERNET", 1200, "WiFi bill"),
            ("MARKETING", 5000, "Instagram ads"),
            ("MAINTENANCE", 3000, "Equipment service"),
        ]
        if month_offset == 2:
            items.append(("EQUIPMENT", 8000, "New dumbbells"))
        for cat, amt, desc in items:
            expenses.append({
                "id": str(uuid.uuid4()), "gym_id": gym_id,
                "category": cat, "amount": amt, "description": desc,
                "date": d.replace(day=random.randint(1, 28)).isoformat(),
            })
    await db.expenses.insert_many([dict(e) for e in expenses])

    # classes (sample)
    classes = [
        {"id": str(uuid.uuid4()), "gym_id": gym_id, "name": "Morning Yoga", "type": "Yoga", "trainerId": trainers[1]["id"], "startTime": "06:00", "endTime": "07:00", "days": ["Mon", "Wed", "Fri"], "capacity": 15},
        {"id": str(uuid.uuid4()), "gym_id": gym_id, "name": "HIIT Blast", "type": "Gym", "trainerId": trainers[2]["id"], "startTime": "07:00", "endTime": "08:00", "days": ["Tue", "Thu"], "capacity": 20},
        {"id": str(uuid.uuid4()), "gym_id": gym_id, "name": "Zumba Night", "type": "Zumba", "trainerId": trainers[3]["id"], "startTime": "18:00", "endTime": "19:00", "days": ["Mon", "Wed", "Fri"], "capacity": 25},
        {"id": str(uuid.uuid4()), "gym_id": gym_id, "name": "CrossFit", "type": "CrossFit", "trainerId": trainers[4]["id"], "startTime": "19:00", "endTime": "20:00", "days": ["Tue", "Thu", "Sat"], "capacity": 12},
    ]
    await db.classes.insert_many([dict(c) for c in classes])


# -------- Startup --------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.members.create_index([("gym_id", 1), ("createdAt", -1)])
    await db.payments.create_index([("gym_id", 1), ("paidAt", -1)])
    await db.attendance.create_index([("gym_id", 1), ("date", -1)])
    await seed_demo()
    logging.info("GymPro startup complete")

@app.on_event("shutdown")
async def shutdown():
    client.close()


# Mount router
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
