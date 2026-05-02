"""GymPro backend API tests - covers auth, members, attendance, payments, leads, trainers, expenses, classes, plans, dashboard."""
import os
import uuid
from datetime import date, timedelta

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://gym-operations-suite-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@gympro.in"
DEMO_PASSWORD = "Demo@123"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(client):
    r = client.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "user" in data and "gym" in data
    return data["token"]


@pytest.fixture(scope="session")
def auth(client, token):
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


# ---------------- AUTH ----------------
class TestAuth:
    def test_login_success(self, client):
        r = client.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
        assert r.status_code == 200
        j = r.json()
        assert j["user"]["email"] == DEMO_EMAIL
        assert j["gym"]["name"] == "FitZone Gym"
        assert isinstance(j["token"], str) and len(j["token"]) > 20

    def test_login_invalid(self, client):
        r = client.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_token(self, client):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_success(self, auth):
        r = auth.get(f"{API}/auth/me")
        assert r.status_code == 200
        j = r.json()
        assert j["user"]["email"] == DEMO_EMAIL
        assert j["gym"]["name"] == "FitZone Gym"

    def test_register_new_gym(self, client):
        unique = uuid.uuid4().hex[:8]
        payload = {
            "name": "Test Owner", "email": f"test_{unique}@gympro.in",
            "password": "Test@123", "gymName": f"TEST_Gym_{unique}",
            "ownerName": "Test Owner", "phone": "9999999999",
            "address": "Addr", "city": "Mumbai", "state": "MH", "pincode": "400001",
        }
        r = requests.post(f"{API}/auth/register", json=payload)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "token" in j
        assert j["gym"]["name"] == payload["gymName"]

        # Duplicate returns 400
        r2 = requests.post(f"{API}/auth/register", json=payload)
        assert r2.status_code == 400


# ---------------- MEMBERS ----------------
class TestMembers:
    def test_list_members_seeded(self, auth):
        r = auth.get(f"{API}/members")
        assert r.status_code == 200
        members = r.json()
        assert len(members) >= 40, f"Expected ~45 seeded, got {len(members)}"
        assert all("membershipId" in m and m["membershipId"].startswith("GYM-") for m in members)

    def test_create_member_auto_id_and_persist(self, auth):
        payload = {
            "name": "TEST_Member_Rohit", "phone": "9876512345",
            "email": "test_m@example.com", "gender": "MALE",
            "membershipType": "Monthly", "membershipFee": 999,
            "joinDate": date.today().isoformat(),
            "expiryDate": (date.today() + timedelta(days=30)).isoformat(),
            "status": "ACTIVE",
        }
        r = auth.post(f"{API}/members", json=payload)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["name"] == payload["name"]
        assert created["membershipId"].startswith(f"GYM-{date.today().year}-")
        mid = created["id"]

        # GET to verify persistence
        g = auth.get(f"{API}/members/{mid}")
        assert g.status_code == 200
        assert g.json()["phone"] == payload["phone"]

        # cleanup
        d = auth.delete(f"{API}/members/{mid}")
        assert d.status_code == 200


# ---------------- ATTENDANCE ----------------
class TestAttendance:
    def test_list_attendance(self, auth):
        r = auth.get(f"{API}/attendance")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_filter_by_date(self, auth):
        today = date.today().isoformat()
        r = auth.get(f"{API}/attendance", params={"date": today})
        assert r.status_code == 200
        for a in r.json():
            assert a["date"] == today

    def test_mark_no_duplicates(self, auth):
        members = auth.get(f"{API}/members").json()
        mid = members[0]["id"]
        today = date.today().isoformat()
        r1 = auth.post(f"{API}/attendance", json={"memberId": mid, "date": today})
        assert r1.status_code == 200
        r2 = auth.post(f"{API}/attendance", json={"memberId": mid, "date": today})
        assert r2.status_code == 200
        assert r1.json()["id"] == r2.json()["id"], "Duplicate attendance created"


# ---------------- PAYMENTS ----------------
class TestPayments:
    def test_list_payments(self, auth):
        r = auth.get(f"{API}/payments")
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_create_payment_extends_expiry(self, auth):
        members = auth.get(f"{API}/members").json()
        active = [m for m in members if m.get("status") == "ACTIVE" and m.get("membershipType") == "Monthly"]
        assert active, "need an active monthly member"
        m = active[0]
        orig_expiry = date.fromisoformat(m["expiryDate"])

        payload = {"memberId": m["id"], "amount": 999, "method": "UPI", "status": "PAID",
                   "description": "Monthly renewal TEST"}
        r = auth.post(f"{API}/payments", json=payload)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["invoiceNo"].startswith(f"INV-{date.today().year}-")
        assert len(j["invoiceNo"].split("-")[-1]) == 4

        # expiry should be extended
        updated = auth.get(f"{API}/members/{m['id']}").json()
        new_expiry = date.fromisoformat(updated["expiryDate"])
        assert new_expiry > orig_expiry
        assert updated["status"] == "ACTIVE"


# ---------------- LEADS ----------------
class TestLeads:
    def test_leads_seeded(self, auth):
        r = auth.get(f"{API}/leads")
        assert r.status_code == 200
        assert len(r.json()) >= 5

    def test_create_and_patch_status(self, auth):
        payload = {"name": "TEST_Lead", "phone": "9000000001", "source": "INSTAGRAM", "status": "NEW"}
        r = auth.post(f"{API}/leads", json=payload)
        assert r.status_code == 200
        lid = r.json()["id"]

        # patch status
        p = auth.patch(f"{API}/leads/{lid}/status", json={"status": "CONTACTED"})
        assert p.status_code == 200
        assert p.json()["status"] == "CONTACTED"

        auth.delete(f"{API}/leads/{lid}")


# ---------------- TRAINERS / EXPENSES / CLASSES / PLANS ----------------
class TestMisc:
    def test_trainers(self, auth):
        r = auth.get(f"{API}/trainers")
        assert r.status_code == 200 and len(r.json()) >= 5

    def test_classes(self, auth):
        r = auth.get(f"{API}/classes")
        assert r.status_code == 200 and len(r.json()) >= 3

    def test_plans(self, auth):
        r = auth.get(f"{API}/plans")
        assert r.status_code == 200 and len(r.json()) >= 4

    def test_expenses(self, auth):
        r = auth.get(f"{API}/expenses")
        assert r.status_code == 200 and len(r.json()) >= 10

    def test_create_update_delete_trainer(self, auth):
        payload = {"name": "TEST_Trainer", "phone": "9000000099", "speciality": "Boxing", "salary": 15000, "isActive": True}
        r = auth.post(f"{API}/trainers", json=payload)
        assert r.status_code == 200
        tid = r.json()["id"]
        u = auth.put(f"{API}/trainers/{tid}", json={**payload, "isActive": False})
        assert u.status_code == 200 and u.json()["isActive"] is False
        d = auth.delete(f"{API}/trainers/{tid}")
        assert d.status_code == 200


# ---------------- DASHBOARD ----------------
class TestDashboard:
    def test_stats_shape(self, auth):
        r = auth.get(f"{API}/dashboard/stats")
        assert r.status_code == 200
        j = r.json()
        for key in ["activeMembers", "monthRevenue", "expiringCount", "todayAttendance",
                    "revenueChart", "planDistribution", "newMembersChart", "weekAttendance", "activity"]:
            assert key in j, f"missing {key}"
        assert len(j["revenueChart"]) == 6
        assert len(j["weekAttendance"]) == 7
        assert j["activeMembers"] > 0


# ---------------- MULTI-TENANT ISOLATION ----------------
class TestMultiTenant:
    def test_new_gym_sees_no_demo_data(self, client):
        unique = uuid.uuid4().hex[:8]
        reg = requests.post(f"{API}/auth/register", json={
            "name": "Iso", "email": f"iso_{unique}@t.in", "password": "Test@123",
            "gymName": f"TEST_Iso_{unique}", "ownerName": "Iso", "phone": "9111111111",
        })
        assert reg.status_code == 200
        tok = reg.json()["token"]
        h = {"Authorization": f"Bearer {tok}"}
        r = requests.get(f"{API}/members", headers=h)
        assert r.status_code == 200
        assert r.json() == [], "new gym should not see other gym's members"
