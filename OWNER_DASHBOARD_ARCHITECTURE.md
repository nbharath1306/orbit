# 🏗️ Owner Dashboard - System Architecture & Data Flow

**Status**: UI 70% Complete, Backend API 0% Complete  
**Date**: December 8, 2025  
**Frontend**: ✅ Dashboard, Properties List, Add Property Wizard Complete  
**Backend**: ⏳ API Routes Pending Implementation  
**Theme**: Emerald/Green Design System

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /owner/dashboard          /owner/properties               │
│  ├─ Stats Cards           ├─ List View                     │
│  ├─ Activity Feed         ├─ Add/Edit Form                │
│  ├─ Quick Actions         ├─ Image Upload                 │
│  └─ Notifications         ├─ Room Management              │
│                           ├─ Pricing                      │
│                           └─ Availability                 │
│                                                            │
│  /owner/bookings           /owner/reviews                 │
│  ├─ Booking List         ├─ Review List                   │
│  ├─ Accept/Decline       ├─ Response Form                 │
│  ├─ Chat                 └─ Sentiment Tags               │
│  └─ Status Tracking                                       │
│                                                            │
│  /owner/analytics          /owner/payments               │
│  ├─ Revenue Chart        ├─ Settlement History            │
│  ├─ Occupancy Trend      ├─ Bank Details                  │
│  ├─ Booking Metrics      └─ Tax Docs                      │
│  └─ Sentiment Breakdown                                   │
│                                                            │
└──────────────────────────┬────────────────────────────────┘
                           │ API Calls
        ┌──────────────────┼────────────────────┐
        │                  │                    │
   ┌────▼──────┐   ┌──────▼────┐      ┌───────▼────┐
   │  Backend   │   │ Cloudinary │    │  SendGrid  │
   │  (Next.js) │   │ (Images)   │    │ (Emails)   │
   │            │   │            │    │            │
   └────┬──────┘   └──────┬────┘      └───────┬────┘
        │                  │                    │
   ┌────▼──────────────────▼────────────────────▼────┐
   │                                                  │
   │        MongoDB Database                        │
   │  ┌──────────────┐  ┌──────────────┐           │
   │  │  User        │  │ Property     │           │
   │  │  (with owner │  │ (with rooms, │           │
   │  │   fields)    │  │  pricing)    │           │
   │  └──────────────┘  └──────────────┘           │
   │                                                │
   │  ┌──────────────┐  ┌──────────────┐           │
   │  │  Booking     │  │  Review      │           │
   │  │  (with       │  │  (with       │           │
   │  │   status)    │  │   sentiment) │           │
   │  └──────────────┘  └──────────────┘           │
   │                                                │
   │  ┌──────────────┐  ┌──────────────┐           │
   │  │  AuditLog    │  │  Message     │           │
   │  │              │  │  (Chat)      │           │
   │  └──────────────┘  └──────────────┘           │
   │                                                │
   └────────────────────────────────────────────────┘

```

---

## 🔄 Data Flow: Property Creation

```
Owner Fill Form
     ↓
┌─ Basic Info: Title, Description
├─ Location: Address → Google Maps API → Lat/Lng
├─ Rooms: Type, Count, Price
├─ Pricing: Base + Add-ons
├─ Amenities: Select from list
└─ Media: Upload images → Cloudinary

Submit Form
     ↓
Validation (Frontend + Backend)
     ↓
POST /api/owner/properties
     ↓
Backend Processing:
├─ Validate owner is real owner
├─ Create property in DB
├─ Extract image URLs from request
├─ Set approval status = 'pending'
└─ Send email to admin

     ↓
Return success + property ID
     ↓
Frontend:
├─ Show success toast
├─ Redirect to property detail
└─ Show "Awaiting Admin Approval" badge

     ↓
Admin Reviews:
├─ Check photos
├─ Verify price
├─ Check description
└─ Approve or Reject

     ↓
Owner Notified:
├─ Email: "Your property is approved!"
├─ Dashboard: Show property as 'active'
└─ Students can now see it

```

---

## 📊 Data Flow: Image Upload

```
Owner Click "Upload Images"
     ↓
Select up to 5 images
     ↓
Drag-Drop or File Picker
     ↓
Show File List:
├─ File 1: room-1.jpg (2.3MB)
├─ File 2: room-2.jpg (1.8MB)
└─ [Add More] button

     ↓
Click "Upload"
     ↓
POST /api/owner/properties/[id]/upload-images
Content-Type: multipart/form-data
     ↓
Backend:
├─ Validate file types (jpg, png, webp)
├─ Validate file sizes (<5MB each)
├─ Upload to Cloudinary
│  ├─ Apply transformation (800x600, auto quality)
│  └─ Get Cloudinary URL
├─ Save URLs in Property model
└─ Return URLs + success

     ↓
Frontend:
├─ Show thumbnails
├─ Allow reorder (drag-drop)
├─ Allow delete
└─ Show "✅ Uploaded Successfully"

Database Update:
property.media.images = [
    "https://res.cloudinary.com/.../room-1.jpg",
    "https://res.cloudinary.com/.../room-2.jpg"
]

```

---

## 💰 Data Flow: Booking & Payment

```
Student Books Room (from student dashboard)
     ↓
POST /api/bookings/create
├─ propertyId
├─ roomId
├─ studentId
├─ dates
└─ rent

     ↓
Create Booking (status = 'pending')
     ↓
Notify Owner:
├─ Email: New booking request
├─ In-app notification
└─ Badge on dashboard

     ↓
Owner Reviews Booking:
/owner/bookings/[id]
├─ Student info
├─ Room details
├─ Rent amount
├─ Move-in date
└─ [Accept] [Decline]

     ↓
Owner Clicks [Accept]
     ↓
POST /api/owner/bookings/[id]/accept
     ↓
Update Booking Status:
├─ status = 'confirmed'
├─ confirmedAt = now
└─ confirmedByOwner = true

     ↓
Notify Student:
├─ Email: Booking confirmed!
├─ In-app notification
└─ Collect deposit

     ↓
Student Pays Deposit (via Razorpay)
     ↓
Payment verified
     ↓
Update Booking:
├─ status = 'checked_in'
├─ paidAt = now
└─ roomStatus = 'occupied'

     ↓
Update Room Stats:
property.liveStats.occupiedRooms += 1

     ↓
Owner Dashboard Updates:
├─ Occupancy: 5/10 → 6/10
├─ Revenue: +₹5,000
├─ Active Bookings: +1
└─ Notification cleared

```

---

## ⭐ Data Flow: Review & Response

```
Student Checks Out (after 30 days)
     ↓
POST /api/reviews
├─ propertyId
├─ rating (1-5 stars)
├─ comment
└─ sentimentTags []

     ↓
Review Created:
├─ status = 'pending'
├─ createdAt = now
└─ responded = false

     ↓
Owner Notified:
├─ Email: New review (3 stars)
├─ Dashboard badge: "1 new review"
└─ In-app notification

     ↓
Owner Views Review:
/owner/properties/[id]/reviews
     ↓
Display Review:
┌─────────────────────────┐
│ Student: Priya ⭐⭐⭐   │
│ "WiFi was slow"         │
│ Tags: WiFi Issues       │
│ Posted: 2 days ago      │
└─────────────────────────┘

     ↓
Owner Clicks [Respond]
     ↓
Show Response Form:
"Thank you Priya! We've upgraded our WiFi..."
[Save] [Cancel]

     ↓
POST /api/reviews/[id]/respond
├─ ownerResponse: "Thank you..."
└─ respondedAt = now

     ↓
Update Database:
review.responded = true
review.ownerResponse = "Thank you..."

     ↓
Student Notified:
├─ Email: Owner responded to your review
├─ In-app notification
└─ See owner's response

     ↓
Dashboard Update:
├─ Review shows ✅ Responded
├─ Property rating recalculated
└─ Sentiment graph updated

```

---

## 📈 Analytics Data Collection

```
REAL-TIME EVENTS:
├─ Property viewed (student clicks it)
├─ Message sent (student inquires)
├─ Booking requested
├─ Booking accepted/declined
├─ Review posted
└─ Review responded

     ↓
POST /api/events (logged in background)

     ↓
DATABASE UPDATES:
property.ownerStats = {
    totalViews: 234,
    totalInquiries: 15,
    totalBookings: 8,
    activeBookings: 2,
    averageOccupancy: 65%,
    monthlyRevenue: ₹45,000,
    averageRating: 4.2,
    reviewCount: 12,
    responseRate: 95%,
    avgResponseTime: 2.5  // hours
}

     ↓
AGGREGATION (runs every hour):
├─ Calculate occupancy trend (30 days)
├─ Calculate revenue trend
├─ Calculate sentiment breakdown
├─ Calculate booking conversion rate
└─ Update dashboard cache

     ↓
OWNER DASHBOARD SHOWS:
┌─ Current Occupancy: 65%        
├─ This Month Revenue: ₹45,000
├─ Pending Bookings: 2
├─ New Inquiries: 3
├─ Average Rating: 4.2 ⭐
├─ Reviews: 12 (10 positive, 2 neutral)
└─ Response Rate: 95%

```

---

## 🔐 Authorization Flow

```
Owner Logs In
     ↓
Auth0 verification
     ↓
Session created with role = 'owner'
     ↓
Redirect to /owner/dashboard
     ↓
Middleware Check:
├─ User logged in? ✓
├─ User role = 'owner' or 'admin'? ✓
└─ Grant access to /owner routes

     ↓
Accessing Property:
GET /api/owner/properties/[id]
     ↓
Backend Check:
├─ User logged in? ✓
├─ propertyId exists? ✓
├─ property.ownerId == userId? ✓ (CRITICAL!)
└─ Return property data

     ↓
If property doesn't belong to owner:
├─ Return 403 Forbidden
└─ Log unauthorized access attempt

```

---

## 📱 Responsive Breakpoints

```
Mobile (< 768px)
├─ Single column layout
├─ Collapsible sidebar
├─ Cards stack vertically
├─ Forms single-field per row
└─ Touch-friendly buttons (44px+)

Tablet (768px - 1024px)
├─ 2-column grid for stats
├─ Side navbar visible
├─ 2-column form layout
└─ Medium spacing

Desktop (> 1024px)
├─ 4-column grid for stats
├─ Full sidebar navigation
├─ 2-3 column forms
└─ Optimized spacing

```

---

## 🎯 Component Hierarchy

```
OwnerLayout
├─ OwnerNav (top navigation)
├─ OwnerSidebar (left sidebar)
└─ Main Content Area
    ├─ /dashboard
    │  ├─ StatsCard (4x cards)
    │  ├─ RecentActivity (feed)
    │  ├─ PropertyQuickList
    │  └─ QuickActions
    │
    ├─ /properties
    │  ├─ PropertyCard (grid)
    │  ├─ Filter controls
    │  └─ Search bar
    │
    ├─ /properties/[id]/edit
    │  ├─ PropertyForm
    │  │  ├─ BasicInfoSection
    │  │  ├─ LocationSection
    │  │  ├─ RoomManagementSection
    │  │  ├─ PricingSection
    │  │  ├─ AmenitiesSection
    │  │  ├─ FeaturesSection
    │  │  ├─ MediaSection
    │  │  │  └─ ImageUpload (Cloudinary)
    │  │  ├─ PreviewSection
    │  │  └─ FormActions
    │  └─ ProgressIndicator
    │
    ├─ /bookings
    │  ├─ BookingCard (list)
    │  ├─ AcceptButton
    │  ├─ DeclineButton
    │  ├─ ChatWindow
    │  └─ StatusBadge
    │
    ├─ /reviews
    │  ├─ ReviewCard
    │  ├─ ResponseForm
    │  ├─ SentimentTags
    │  └─ RatingFilter
    │
    ├─ /analytics
    │  ├─ OccupancyChart (Line)
    │  ├─ RevenueChart (Bar)
    │  ├─ KeyMetrics (Cards)
    │  └─ SentimentBreakdown (Pie)
    │
    ├─ /payments
    │  ├─ EarningsCard
    │  ├─ SettlementTable
    │  ├─ BankDetails
    │  └─ TaxDocuments
    │
    ├─ /profile
    │  ├─ ProfileForm
    │  ├─ AvatarUpload
    │  └─ BankDetailsForm
    │
    └─ /settings
       ├─ NotificationPrefs
       ├─ PasswordChange
       ├─ 2FA Setup
       └─ ActivityLog

```

---

## 🗄️ Database Relationships

```
┌─ User ─────────────────┐
│ id, name, email        │
│ role, phone            │
│ bankAccount            │
│ profilePicture         │
│ ownerStats            │
└────────┬────────────────┘
         │ 1:N
         │
    ┌────▼───────────────────┐
    │ Property                │
    │ id, title, description │
    │ location, price        │
    │ amenities, media       │
    │ liveStats             │
    │ approvalStatus        │
    │ roomTypes            │
    │ policies             │
    └────┬─────────────┬─────┘
         │ 1:N         │ 1:N
         │             │
    ┌────▼──────┐  ┌────▼─────┐
    │ Booking    │  │ Review    │
    │ id, status │  │ id, rating│
    │ studentId  │  │ comment   │
    │ checkIn    │  │ studentId │
    │ rent       │  │ tags      │
    └────────────┘  └───────────┘
```

---

## 🚀 Deployment Flow

```
Code Changes → Git Push
     ↓
GitHub Actions (CI/CD)
├─ Run tests
├─ Build Next.js app
└─ Deploy to Vercel

     ↓
Environment Variables:
├─ DATABASE_URL
├─ NEXTAUTH_SECRET
├─ CLOUDINARY_CLOUD_NAME
├─ CLOUDINARY_API_KEY
└─ OWNER_COMMISSION_RATE

     ↓
Cloudinary Setup:
├─ Create account
├─ Get API keys
├─ Configure transformations
└─ Enable unsigned uploads (for owner images)

     ↓
Testing:
├─ Create test owner account
├─ Add test property
├─ Upload test images
├─ Verify they appear on student side
└─ Check analytics

     ↓
Go Live! 🎉

```

---

**This is the complete system architecture for Owner Dashboard!**

All pieces fit together to create a seamless property management experience.

