# 🧪 Booking System Testing - Owner Credentials & Data

**Date**: December 30, 2025  
**Status**: ✅ All bookings deleted, ready for testing

---

## 📊 Cleanup Summary

| Item | Status | Count |
|------|--------|-------|
| **Bookings Deleted** | ✅ Complete | 2 |
| **Remaining Bookings** | ✅ Verified | 0 |
| **Owners in System** | ✅ Found | 1 |
| **Properties** | ✅ Available | 3 |

---

## 👥 Owner Account Credentials

### Owner 1: Demo Owner

```
📧 Email: owner@orbit.com
🔐 Password: Use password reset or OAuth login
👤 Role: Owner
✅ Status: Active
```

#### Properties Owned:
1. **Sai Balaji PG**
   - 📍 Behind SBI Bank, Harohalli Main Road, Karnataka 562112
   - 🏠 Property Type: PG

2. **DSU Hostels**
   - 📍 DSU Campus, Block C, Harohalli, Karnataka 562112
   - 🏠 Property Type: Hostel

3. **Green View Residency**
   - 📍 Near KSRTC Bus Stand, Harohalli Main Road, Karnataka 562112
   - 🏠 Property Type: Residential

---

## 🧪 Testing Workflow

### Step 1: Login as Owner

```
URL: http://localhost:3000/owner-signin
Email: owner@orbit.com
Password: Click "Forgot Password" or use OAuth login
```

### Step 2: Navigate to Owner Dashboard

```
Dashboard Home → Overview (Revenue, Bookings, Reviews)
Properties Tab → Manage listings
Bookings Tab → View booking requests
Messages Tab → Check incoming messages
```

### Step 3: Create Test Booking (as Student)

```
1. Open incognito/new browser window
2. Go to http://localhost:3000
3. Search for property: "Sai Balaji PG" or "DSU Hostels"
4. Click "Book Now"
5. Fill booking details
6. Submit booking
```

### Step 4: Verify in Owner Dashboard

- ✅ Booking request appears in "Pending Requests" section
- ✅ Notification shows new booking
- ✅ Owner can Accept/Reject booking
- ✅ Messages appear when student sends message

### Step 5: Test Message Flow

```
From Student:
1. Go to property details
2. Click "Message Owner"
3. Send test message
4. Check if owner receives notification

From Owner:
1. Go to Messages tab
2. See conversation with student
3. Reply to student
4. Verify student receives message
```

---

## 🔄 Expected Booking Workflow

```
1. Student Creates Booking
   ↓ Status: PENDING
   ↓ Owner gets notification

2. Owner Sees Booking Request
   ↓ In OwnerBookingManagement component
   ↓ Shows Accept/Reject buttons

3. Owner Accepts Booking
   ↓ Status: CONFIRMED
   ↓ Student gets notification
   ↓ Student can now pay

4. Student Pays
   ↓ Status: PAID
   ↓ Owner gets payment confirmation

5. Move-in Happens
   ↓ Status: COMPLETED
```

---

## 🐛 Testing Checklist

- [ ] Owner can login successfully
- [ ] Owner dashboard loads without errors
- [ ] Owner can see properties listed
- [ ] Create booking from student account
- [ ] Booking appears in owner's "Pending Requests"
- [ ] Owner can Accept booking
- [ ] Owner can Reject booking
- [ ] Booking status changes to Confirmed after accept
- [ ] Student receives notification of acceptance
- [ ] Messages appear in real-time
- [ ] Owner can reply to messages
- [ ] Student sees owner's replies
- [ ] Payment button shows after confirmation
- [ ] All status badges display correctly
- [ ] Audit logs record all actions

---

## 💡 Troubleshooting

### Owner Dashboard Not Loading
```
❌ Problem: "Page not found"
✅ Solution: Make sure you're on http://localhost:3000/owner (not /admin)
```

### Bookings Not Appearing
```
❌ Problem: "No bookings show up"
✅ Solution: 
   1. Check that booking is created on same property owner owns
   2. Refresh the page (F5)
   3. Check browser console for errors
```

### Messages Not Receiving
```
❌ Problem: "Messages not appearing"
✅ Solution:
   1. Check that student sent message after booking created
   2. Verify both users are logged in different windows
   3. Check /api/messages endpoint is working
   4. Check database for message collection
```

### Notifications Not Working
```
❌ Problem: "No toast/notification appeared"
✅ Solution:
   1. Check browser dev console (F12)
   2. Verify API response is 200
   3. Check notification permission in browser
```

---

## 🔐 Security Notes

- Owner password not stored in plaintext (use OAuth or reset)
- All booking actions logged to audit trail
- Message content encrypted in transit (TLS)
- Each owner can only see their own properties
- Each student can only book their own bookings

---

## 📁 Database State

### Before Cleanup
- ❌ 2 bookings deleted
- ✅ All properties preserved
- ✅ All users preserved

### After Cleanup
- ✅ 0 bookings (clean slate)
- ✅ 1 owner account ready
- ✅ 3 properties available for booking
- ✅ All audit logs preserved

---

## 🚀 Next Steps

1. **Test Booking Creation** → Create a booking and verify it appears in owner dashboard
2. **Test Message Flow** → Send message from student to owner and verify delivery
3. **Test Acceptance** → Accept booking and verify student gets notification
4. **Test Payment** → Complete payment flow and verify owner sees "Paid" status
5. **Monitor Audit Logs** → Check /admin/audit-logs for all actions

---

## 📝 Notes

- All timestamps are in IST (Indian Standard Time)
- Bookmark the owner login page: http://localhost:3000/owner-signin
- Keep browser dev console open (F12) to see any errors
- Test on both desktop and mobile (DevTools mobile mode)
- Check network tab to see API calls being made

---

**Ready for Testing!** ✅

Contact: Check database for owner contact details
Last Update: December 30, 2025
