# 🎓 User Dashboard - Architecture & Component Framework

**Date**: December 8, 2025  
**Status**: 📋 Design Phase - Ready for Implementation

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /dashboard                    /dashboard/bookings             │
│  ├─ Welcome Card               ├─ Booking List                 │
│  ├─ Stats Cards                ├─ Booking Details             │
│  ├─ Quick Actions              ├─ Status Timeline             │
│  ├─ Recent Activity Feed       ├─ Action Buttons              │
│  └─ Recommendations            │  (Cancel, Contact Owner)     │
│                                 └─ Payment Status             │
│                                                                │
│  /dashboard/saved              /dashboard/profile             │
│  ├─ Saved Properties           ├─ Personal Information        │
│  ├─ Filter & Sort             ├─ Avatar Upload               │
│  ├─ View/Remove               ├─ Phone & Address             │
│  ├─ Add to Wishlist           ├─ Preferences                 │
│  └─ Share Options             ├─ Privacy Settings            │
│                                 └─ Change Password             │
│                                                                │
│  /dashboard/messages           /dashboard/notifications      │
│  ├─ Conversation List          ├─ Notification Center        │
│  ├─ Chat Interface             ├─ Filter by Type             │
│  ├─ Message History            ├─ Mark as Read               │
│  ├─ Real-time Updates          └─ Notification Preferences   │
│  └─ User/Owner Chat                                           │
│                                                                │
│  /dashboard/reviews            /dashboard/payments           │
│  ├─ Review History             ├─ Payment History            │
│  ├─ Write Review               ├─ Receipt Download           │
│  ├─ Rating Breakdown           ├─ Payment Methods            │
│  └─ Sentiment Tags             ├─ Refund Status              │
│                                 └─ Invoice Management         │
│                                                                │
│  /dashboard/settings           /dashboard/analytics          │
│  ├─ Account Settings           ├─ Booking Trends             │
│  ├─ Notification Prefs         ├─ Spending Analytics         │
│  ├─ Privacy Controls           ├─ Property Views             │
│  └─ Account Deletion           └─ Engagement Metrics         │
│                                                                │
└───────────────────────────────┬─────────────────────────────┘
                                │ API Calls
                ┌───────────────┼───────────────┐
                │               │               │
           ┌────▼──────┐   ┌────▼────┐   ┌─────▼──────┐
           │  Backend   │   │SendGrid │   │ Razorpay   │
           │  (APIs)    │   │(Emails) │   │(Payments)  │
           │            │   │         │   │            │
           └────┬──────┘   └─────────┘   └────────────┘
                │
           ┌────▼──────────────────────────────────┐
           │     MongoDB Database (User Data)      │
           │  ┌──────────────┐  ┌──────────────┐  │
           │  │ User         │  │ Booking      │  │
           │  │ (email, name)│  │ (with price) │  │
           │  └──────────────┘  └──────────────┘  │
           │                                       │
           │  ┌──────────────┐  ┌──────────────┐  │
           │  │ SavedProperty│  │ Review       │  │
           │  │ (wishlist)   │  │ (by user)    │  │
           │  └──────────────┘  └──────────────┘  │
           │                                       │
           │  ┌──────────────┐  ┌──────────────┐  │
           │  │ Message      │  │ Notification │  │
           │  │ (chat)       │  │ (user)       │  │
           │  └──────────────┘  └──────────────┘  │
           │                                       │
           └───────────────────────────────────────┘

```

---

## 🎨 User Dashboard Components Framework

### **Follows Same Principles As:**
- ✅ **Admin Dashboard**: Stats cards, activity feed, quick actions, data-driven design
- ✅ **Owner Dashboard**: Personalized metrics, activity tracking, action-oriented interface

---

## 📦 Component Structure

### **1. LAYOUT COMPONENTS**

#### `UserNav.tsx` (Sidebar Navigation)
**Framework Consistency**: Same as `AdminNav.tsx` & `OwnerNav.tsx`

```typescript
Props:
- currentPage: string
- onNavigate: (page: string) => void
- userName: string
- userAvatar?: string
- unreadCount?: number

Features:
- Minimizable sidebar with chevron toggle
- Icons for each section
- Notification badge on Messages/Alerts
- Quick logout button
- Profile quick-access
```

**Navigation Links:**
1. Dashboard (home icon)
2. My Bookings (calendar icon)
3. Saved Properties (heart icon)
4. Messages (chat icon)
5. Reviews (star icon)
6. Payments (credit-card icon)
7. Profile (user icon)
8. Notifications (bell icon)
9. Settings (gear icon)

---

#### `UserLayoutContent.tsx` (Main Layout Wrapper)
**Framework Consistency**: Similar to `PremiumLayout.tsx`

```typescript
Props:
- children: ReactNode
- title: string
- breadcrumbs?: BreadcrumbItem[]
- actions?: React.ReactNode

Features:
- Responsive grid layout
- Sidebar + main content area
- Sticky header with title
- Gradient backgrounds (consistent with admin/owner)
- Collapsible navigation support
```

---

### **2. DASHBOARD HOME COMPONENTS**

#### `WelcomeCard.tsx`
**Purpose**: Personalized greeting

```typescript
Props:
- userName: string
- userAvatar?: string
- lastLoginDate: Date
- newNotifications: number

Features:
- User greeting with time-based message
- Next booking date highlight
- Quick statistics summary
- CTA buttons to popular actions
```

**Example Output:**
```
"Good Evening, Akhil! 👋
Next booking: Dec 15 at Green Heights
3 new messages • 1 pending action"
```

---

#### `UserStatsCard.tsx`
**Framework Consistency**: Extends `StatsCard.tsx` from admin dashboard

```typescript
Props:
- stats: {
    activeBookings: number,
    savedProperties: number,
    totalSpent: number,
    averageRating: number,
    unreadMessages: number,
    pendingReviews: number,
  }

Card Layout (2x3 grid):
┌─────────────────────────────────┐
│ 📅 Active Bookings      │    2   │
├─────────────────────────────────┤
│ ❤️  Saved Properties    │    8   │
├─────────────────────────────────┤
│ 💰 Total Spent (Month)  │ ₹45K   │
├─────────────────────────────────┤
│ ⭐ Avg Rating           │   4.8  │
├─────────────────────────────────┤
│ 💬 Unread Messages      │    3   │
├─────────────────────────────────┤
│ ✍️  Pending Reviews     │    1   │
└─────────────────────────────────┘

Color Scheme:
- Bookings: Blue (#3B82F6)
- Saved: Purple (#A855F7)
- Spending: Amber (#FBBF24)
- Rating: Orange (#FB923C)
- Messages: Green (#10B981)
- Reviews: Pink (#EC4899)
```

---

#### `QuickActionButtons.tsx`
**Purpose**: Fast access to common tasks

```typescript
Props:
- onAction: (action: string) => void

Actions (4 buttons):
1. 🔍 "Search Properties" → /search
2. ➕ "Make a Booking" → /search with modal
3. 💬 "Message Owner" → /messages
4. ⭐ "Write Review" → /reviews?pending=true
```

---

#### `RecentActivityFeed.tsx`
**Framework Consistency**: Similar to activity feed in admin dashboard

```typescript
Props:
- activities: Activity[]
- onActivityClick: (id: string) => void
- maxItems?: number (default: 5)

Activity Types:
- "booking_confirmed" → ✅ Green
- "booking_cancelled" → ❌ Red
- "review_response" → 💬 Blue
- "message_received" → 📨 Purple
- "payment_received" → 💰 Amber
- "property_liked" → ❤️ Pink

Structure:
┌─ Activity Card
│  ├─ Type Icon
│  ├─ Title & Description
│  ├─ Timestamp (relative)
│  └─ Action Link (if applicable)
└─ Timeline connector
```

---

#### `PropertyRecommendations.tsx`
**Purpose**: ML-based property suggestions

```typescript
Props:
- recommendations: Property[]
- onPropertyClick: (propertyId: string) => void
- onSave: (propertyId: string) => void

Features:
- Carousel or 3-column grid
- Based on:
  * Previous searches
  * Budget range
  * Preferred locations
  * Previous bookings
- Quick actions: View, Save, Share
- Price and rating display
```

---

### **3. BOOKINGS COMPONENTS**

#### `BookingList.tsx`
**Purpose**: Display all user bookings with status

```typescript
Props:
- bookings: Booking[]
- filter?: 'active' | 'completed' | 'cancelled' | 'all'
- onBookingClick: (bookingId: string) => void

Display Options:
- List view (default)
- Card view (grid)
- Timeline view (chronological)

Columns/Info:
- Property Image (thumbnail)
- Property Name
- Owner Name
- Check-in/Check-out Dates
- Status Badge
  * 🟡 Pending (yellow)
  * 🟢 Confirmed (green)
  * 🔴 Rejected (red)
  * ⚫ Cancelled (gray)
  * 🟣 Completed (purple)
- Price
- Actions (View, Cancel, Contact)
```

---

#### `BookingDetailCard.tsx`
**Purpose**: Detailed view of single booking

```typescript
Props:
- booking: BookingWithDetails
- isExpandable?: boolean
- showActions?: boolean

Sections:
1. Header
   - Property image (large)
   - Property name + owner
   - Status badge with timeline

2. Booking Info
   - Check-in date & time
   - Check-out date & time
   - Duration (nights/days)
   - Room type & amenities

3. Pricing Breakdown
   - Base price
   - Taxes/Fees
   - Total amount
   - Payment status

4. Owner Info
   - Name, avatar, rating
   - Verification badge
   - Contact information

5. Actions
   - Message Owner
   - View Property
   - Cancel Booking (if eligible)
   - Download Invoice
```

---

#### `BookingStatusTimeline.tsx`
**Purpose**: Visual booking journey

```typescript
Props:
- booking: Booking
- steps?: TimelineStep[]

Default Steps:
1. Booking Created → 🟡
2. Payment Pending → ⏳
3. Owner Confirmation → 🤝
4. Check-in Ready → 📌
5. Check-out Complete → ✅

Visual:
Created (Day 1)
    ↓
Payment Processed (Day 1)
    ↓
Owner Approved (Day 2)
    ↓
Active Booking (Day 3-15)
    ↓
Completed (Day 16)
```

---

#### `CancelBookingModal.tsx`
**Purpose**: Safe cancellation flow

```typescript
Props:
- booking: Booking
- onCancel: () => void
- onConfirm: (reason: string) => void

Features:
- Refund eligibility check
- Cancellation reason selection
- Policy display
- Confirmation warning
- Refund timeline info
```

---

### **4. SAVED PROPERTIES COMPONENTS**

#### `SavedPropertiesList.tsx`
**Purpose**: Wishlist management

```typescript
Props:
- savedProperties: SavedProperty[]
- filter?: SavedProperty[]
- onRemove: (propertyId: string) => void
- onView: (propertyId: string) => void
- onBookNow: (propertyId: string) => void

Features:
- Filter by: Price range, Location, Type
- Sort by: Recently saved, Price (H→L), Rating
- Bulk actions (select multiple)
- Share wishlist
- Organize into collections
  * "Summer Stays"
  * "Budget Options"
  * "Luxury Picks"
  * etc.

Card Layout:
┌──────────────────────┐
│  Image (with hover)  │
│  - Quick preview btn │
│  - Share icon        │
├──────────────────────┤
│ Title | ⭐ 4.8      │
│ Location | Budget    │
│ 3 Amenities...       │
├──────────────────────┤
│ [View] [Book] [x]    │
└──────────────────────┘
```

---

#### `SavedPropertyFilters.tsx`
**Purpose**: Advanced filtering

```typescript
Filters Available:
- Price Range (min-max slider)
- Location/Area
- Property Type
- Amenities (checkboxes)
- Rating (min rating)
- Recently Saved
- Distance from University

UI:
Collapsible sidebar with:
- Range sliders
- Dropdown selects
- Checkbox groups
- Reset button
- Apply filters button
```

---

### **5. MESSAGES/CHAT COMPONENTS**

#### `ConversationList.tsx`
**Purpose**: List of all conversations

```typescript
Props:
- conversations: Conversation[]
- selectedId?: string
- onSelect: (conversationId: string) => void
- onDelete: (conversationId: string) => void

Display:
- User/Owner avatar
- Last message preview
- Unread count badge
- Last message timestamp
- Search box to filter
- Mark as read/unread

Sorting: Most recent first
```

---

#### `ChatInterface.tsx`
**Purpose**: Real-time messaging

```typescript
Props:
- conversation: Conversation
- onSendMessage: (message: string) => void
- isLoading?: boolean

Features:
- Message history (scrollable)
- Auto-scroll to latest
- Message timestamps
- User/Owner indicators
- Typing indicator
- Message status (sent, delivered, read)
- Attachment preview
- Emoji picker

UI:
┌─────────────────────────┐
│  Header (Name + Status) │
├─────────────────────────┤
│                         │
│  Message History        │
│  (Auto-scroll)          │
│                         │
├─────────────────────────┤
│ [Input] [Send] [+Attach]│
└─────────────────────────┘
```

---

#### `MessageNotification.tsx`
**Purpose**: Toast/badge for new messages

```typescript
Props:
- message: Message
- sender: User
- onOpen: () => void

Display:
- Sender avatar
- Message preview (truncated)
- Timestamp
- Quick reply button
```

---

### **6. REVIEWS COMPONENTS**

#### `ReviewList.tsx`
**Purpose**: User's review history

```typescript
Props:
- reviews: Review[]
- filter?: 'pending' | 'written' | 'responded' | 'all'
- onWrite: (propertyId: string) => void
- onView: (reviewId: string) => void

Status Indicators:
- 📝 "Pending" (can write review)
- ✅ "Written" (published)
- 💬 "Owner Responded" (has reply)

Display:
- Property name + image
- Your rating (stars)
- Your review text
- Timestamp
- Owner response (if any)
- Edit/Delete buttons
```

---

#### `WriteReviewModal.tsx`
**Purpose**: Create new review

```typescript
Props:
- propertyId: string
- propertyName: string
- ownerName: string
- onSubmit: (review: ReviewData) => void
- onCancel: () => void

Form Fields:
1. Star Rating (1-5 interactive)
2. Review Title
3. Review Description (textarea)
4. Sentiment Tags
   - "Clean" / "Dirty"
   - "Friendly" / "Unfriendly"
   - "Value for Money"
   - "Location"
   - "Amenities"
   - "Noise Level"
5. Recommend to Others? (toggle)

Validation:
- Min 20 characters for review
- Required rating
- Max 500 characters
```

---

#### `ReviewAnalytics.tsx`
**Purpose**: User review statistics

```typescript
Props:
- reviews: Review[]

Display:
┌──────────────────────────┐
│  Average Rating: 4.6/5   │
│  Total Reviews: 8        │
├──────────────────────────┤
│ ⭐⭐⭐⭐⭐  3 reviews     │
│ ⭐⭐⭐⭐☆   2 reviews     │
│ ⭐⭐⭐☆☆   2 reviews     │
│ ⭐⭐☆☆☆   1 review      │
│ ⭐☆☆☆☆   0 reviews     │
└──────────────────────────┘

Sentiment Analysis:
- Most common tags
- Sentiment breakdown
- Trends over time (chart)
```

---

### **7. PROFILE COMPONENTS**

#### `UserProfileCard.tsx`
**Purpose**: User information display

```typescript
Props:
- user: UserProfile
- isOwnProfile: boolean
- onEdit?: () => void

Display Sections:
1. Avatar + Cover Photo
   - Large avatar
   - Change button (if own profile)
   - Verification badge

2. Personal Info
   - Name
   - Email (masked if not owner)
   - Phone (if verified)
   - University
   - Member since date
   - Verification status

3. Stats
   - Bookings completed
   - Average rating given
   - Reviews written
   - Member for (days/months)
```

---

#### `EditProfileForm.tsx`
**Purpose**: Update user profile

```typescript
Props:
- user: UserProfile
- onSave: (updatedUser: UserProfile) => void
- onCancel: () => void

Editable Fields:
- Name
- Phone (with verification)
- University
- Avatar (upload)
- Bio/About
- Preferences

Validation:
- Name: 2-50 characters
- Phone: Valid format
- Avatar: Image files only, 5MB max
```

---

#### `AvatarUploadSection.tsx`
**Purpose**: Profile picture management

```typescript
Props:
- currentAvatar?: string
- onUpload: (file: File) => void
- isUploading?: boolean

Features:
- Drag & drop area
- File picker
- Preview
- Crop tool (optional)
- Upload progress
- Replace/Remove options

Similar to admin avatar upload but for users
```

---

#### `PasswordChangeForm.tsx`
**Purpose**: Secure password update

```typescript
Props:
- onSubmit: (currentPwd, newPwd) => void

Fields:
- Current password
- New password (with strength meter)
- Confirm new password
- Show/hide toggle

Validation:
- Current password correct
- New password ≠ old password
- Min 8 characters
- Requires uppercase, lowercase, number, special char
```

---

### **8. PAYMENTS COMPONENTS**

#### `PaymentHistoryTable.tsx`
**Purpose**: Transaction history

```typescript
Props:
- payments: Payment[]
- filter?: 'all' | 'successful' | 'failed' | 'refunded'
- onDetails: (paymentId: string) => void

Columns:
- Date
- Property Name
- Amount
- Status Badge
  * ✅ Successful (green)
  * 🔄 Pending (yellow)
  * ❌ Failed (red)
  * ↩️  Refunded (blue)
- Invoice Link
- Details Link

Pagination: 10 per page
Export: CSV button
```

---

#### `PaymentReceiptModal.tsx`
**Purpose**: Receipt view & download

```typescript
Props:
- payment: Payment
- onClose: () => void

Sections:
1. Header: Receipt #, Date
2. Billing Info: User details
3. Property Info: What was booked
4. Charges Breakdown:
   - Base price
   - Taxes
   - Discounts
   - Total

5. Payment Method: Card/UPI used
6. Status: Confirmed/Processing
7. Actions: Download PDF, Share

Similar to invoice templates but user-focused
```

---

#### `PaymentMethodManager.tsx`
**Purpose**: Saved payment methods

```typescript
Props:
- paymentMethods: PaymentMethod[]
- onAdd: () => void
- onDelete: (methodId: string) => void
- onSetDefault: (methodId: string) => void

Display:
- Card preview (last 4 digits)
- Expiry date
- Default badge
- Delete button
- Add new method button

Supports: Credit Card, Debit Card, UPI
```

---

### **9. NOTIFICATIONS COMPONENTS**

#### `NotificationCenter.tsx`
**Purpose**: Centralized notification management

```typescript
Props:
- notifications: Notification[]
- onMarkAsRead: (notificationId: string) => void
- onDelete: (notificationId: string) => void
- onFilter: (type: string) => void

Notification Types:
- 📅 Booking Updates
- 💬 Messages
- ⭐ Reviews
- 💰 Payments
- 🔔 System

Display:
- Icon (type-specific)
- Title & description
- Timestamp
- Mark as read toggle
- Delete button

Features:
- Filter by type
- Mark all as read
- Auto-dismiss old notifications
- Sort by recent
```

---

#### `NotificationPreferences.tsx`
**Purpose**: Notification settings

```typescript
Props:
- preferences: NotificationPreferences
- onUpdate: (preferences: NotificationPreferences) => void

Options (Toggles):
- Email notifications
- SMS alerts
- In-app notifications
- Push notifications (if PWA)

Per Type:
- Booking confirmations
- Messages
- Reviews
- Payments
- Promotions
- System alerts

UI: Toggle switches with descriptions
```

---

### **10. SETTINGS COMPONENTS**

#### `AccountSettings.tsx`
**Purpose**: Account configuration

```typescript
Props:
- user: UserProfile
- onUpdate: (updates: Partial<UserProfile>) => void

Sections:
1. Email & Phone
   - Change email (verification required)
   - Change phone (OTP verification)

2. Password
   - Change password form

3. Account Status
   - Active/Inactive toggle
   - Last login info
   - Devices/Sessions

4. Data Management
   - Download my data
   - Delete account (irreversible)

5. Deactivation
   - Temporarily deactivate
   - Reactivation instructions
```

---

#### `PrivacySettings.tsx`
**Purpose**: Privacy & data controls

```typescript
Props:
- privacy: PrivacySettings
- onUpdate: (privacy: PrivacySettings) => void

Options:
- Profile visibility (Public/Private/Friends only)
- Show email publicly
- Show phone publicly
- Allow owner messages
- Allow reviews visibility
- Data sharing with partners
- Cookie preferences
- Tracking opt-out

Display: Toggles with explanations
```

---

### **11. ANALYTICS COMPONENTS**

#### `BookingTrendsChart.tsx`
**Purpose**: Booking activity visualization

```typescript
Props:
- data: BookingData[]
- timeRange: '7d' | '30d' | '90d' | '1y'
- onRangeChange: (range) => void

Chart Types:
- Line chart (number of bookings over time)
- Bar chart (by property)
- Status breakdown (pie chart)

Shows:
- Total bookings in period
- Average bookings per month
- Peak booking periods
- Comparison with previous period
```

---

#### `SpendingAnalytics.tsx`
**Purpose**: Budget and spending insights

```typescript
Props:
- payments: Payment[]
- timeRange: '7d' | '30d' | '90d' | '1y'

Display:
1. Total Spent (period)
2. Average Booking Cost
3. Monthly Trend (line chart)
4. Spending by Property Type (bar chart)
5. Biggest Expense (property/date)
6. Forecast (next month)

Actions:
- Set budget alerts
- Export summary
```

---

#### `PropertyViewAnalytics.tsx`
**Purpose**: Browsing behavior

```typescript
Props:
- analytics: PropertyViewData[]

Shows:
- Most viewed properties
- Search queries (keywords)
- Properties clicked but not booked
- Average time spent on property
- Conversion rate (view → booking)

Helps suggest:
- Properties to recommend
- Better search optimization
```

---

## 🗂️ Folder Structure

```
src/
├── app/
│   └── dashboard/
│       ├── layout.tsx              ← User Dashboard Layout
│       ├── page.tsx                ← Home/Overview
│       ├── bookings/
│       │   └── page.tsx
│       ├── [bookingId]/
│       │   └── page.tsx            ← Booking Detail
│       ├── saved/
│       │   └── page.tsx
│       ├── messages/
│       │   ├── page.tsx
│       │   └── [conversationId]/
│       │       └── page.tsx
│       ├── reviews/
│       │   └── page.tsx
│       ├── profile/
│       │   └── page.tsx
│       ├── notifications/
│       │   └── page.tsx
│       ├── payments/
│       │   └── page.tsx
│       ├── analytics/
│       │   └── page.tsx
│       └── settings/
│           └── page.tsx
│
├── components/
│   ├── user/
│   │   ├── dashboard/
│   │   │   ├── WelcomeCard.tsx
│   │   │   ├── UserStatsCard.tsx
│   │   │   ├── QuickActionButtons.tsx
│   │   │   ├── RecentActivityFeed.tsx
│   │   │   └── PropertyRecommendations.tsx
│   │   │
│   │   ├── bookings/
│   │   │   ├── BookingList.tsx
│   │   │   ├── BookingDetailCard.tsx
│   │   │   ├── BookingStatusTimeline.tsx
│   │   │   └── CancelBookingModal.tsx
│   │   │
│   │   ├── saved/
│   │   │   ├── SavedPropertiesList.tsx
│   │   │   └── SavedPropertyFilters.tsx
│   │   │
│   │   ├── messages/
│   │   │   ├── ConversationList.tsx
│   │   │   ├── ChatInterface.tsx
│   │   │   └── MessageNotification.tsx
│   │   │
│   │   ├── reviews/
│   │   │   ├── ReviewList.tsx
│   │   │   ├── WriteReviewModal.tsx
│   │   │   └── ReviewAnalytics.tsx
│   │   │
│   │   ├── profile/
│   │   │   ├── UserProfileCard.tsx
│   │   │   ├── EditProfileForm.tsx
│   │   │   ├── AvatarUploadSection.tsx
│   │   │   └── PasswordChangeForm.tsx
│   │   │
│   │   ├── payments/
│   │   │   ├── PaymentHistoryTable.tsx
│   │   │   ├── PaymentReceiptModal.tsx
│   │   │   └── PaymentMethodManager.tsx
│   │   │
│   │   ├── notifications/
│   │   │   ├── NotificationCenter.tsx
│   │   │   └── NotificationPreferences.tsx
│   │   │
│   │   ├── settings/
│   │   │   ├── AccountSettings.tsx
│   │   │   └── PrivacySettings.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── BookingTrendsChart.tsx
│   │   │   ├── SpendingAnalytics.tsx
│   │   │   └── PropertyViewAnalytics.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── UserNav.tsx
│   │   │   └── UserLayoutContent.tsx
│   │   │
│   │   └── ui/
│   │       ├── BookingStatusBadge.tsx
│   │       ├── StatCard.tsx
│   │       └── ActionCard.tsx
│   │
│   └── ui/  ← Shared UI components (existing)
│
├── app/api/user/
│   ├── stats/route.ts              ← Get user dashboard stats
│   ├── bookings/route.ts           ← Get user bookings
│   ├── bookings/[id]/route.ts      ← Get booking details
│   ├── bookings/[id]/cancel/route.ts ← Cancel booking
│   ├── saved/route.ts              ← Get saved properties
│   ├── saved/[id]/route.ts         ← Add/remove saved
│   ├── messages/route.ts           ← Get conversations
│   ├── messages/[id]/route.ts      ← Get conversation details
│   ├── reviews/route.ts            ← Get user reviews
│   ├── reviews/route.ts (POST)     ← Create review
│   ├── profile/route.ts            ← Get/update profile
│   ├── profile/avatar/route.ts     ← Upload avatar
│   ├── notifications/route.ts      ← Get notifications
│   ├── payments/route.ts           ← Get payment history
│   ├── analytics/bookings/route.ts ← Booking trends
│   ├── analytics/spending/route.ts ← Spending analytics
│   └── settings/route.ts           ← Get/update settings
│
└── models/
    ├── SavedProperty.ts            ← Wishlist model
    └── (Update existing models)
```

---

## 🔄 Data Flow Patterns

### **Pattern 1: Dashboard Load**
```
User Visits /dashboard
    ↓
useEffect triggers multiple parallel API calls:
├─ /api/user/stats (stats cards)
├─ /api/user/bookings?limit=5 (recent bookings)
├─ /api/user/saved?limit=3 (saved properties)
├─ /api/user/notifications?unread=true
└─ /api/user/messages/count (unread count)
    ↓
All data resolved, display dashboard
    ↓
Auto-refresh every 30 seconds (polling)
or WebSocket for real-time updates
```

---

### **Pattern 2: Booking Flow**
```
User Clicks "View Booking"
    ↓
Navigate to /dashboard/bookings/[bookingId]
    ↓
useEffect calls /api/user/bookings/[id]
    ↓
Display BookingDetailCard with:
- Full property info
- Status timeline
- Owner contact info
- Cancel/Contact buttons
    ↓
User Actions:
- Cancel → CancelBookingModal → API call
- Contact → Navigate to /messages/[ownerId]
- View Property → External link to /pg/[slug]
```

---

### **Pattern 3: Message Flow (Real-time)**
```
User Opens /dashboard/messages
    ↓
Load conversation list
    ↓
Select conversation
    ↓
Connect to WebSocket for real-time updates
    ↓
Chat Interface streams new messages
    ↓
Send message:
├─ Optimistic UI update
├─ Send via API/WebSocket
└─ Confirm when server responds
```

---

## 🎨 Design System Consistency

### **Color Scheme** (matches admin/owner)
```
Primary: #3B82F6 (Blue)
Secondary: #8B5CF6 (Purple)
Accent: #EC4899 (Pink)
Success: #10B981 (Green)
Warning: #F59E0B (Amber)
Danger: #EF4444 (Red)
Info: #06B6D4 (Cyan)

Background: #F8FAFC (Slate-50)
Text: #1E293B (Slate-900)
Border: #E2E8F0 (Slate-200)
```

### **Typography**
```
Headings: Inter/Geist (bold)
Body: Inter/Geist (regular)
Monospace: Monaco (for codes/numbers)
```

### **Component Patterns**
```
✅ Stats Cards: Icon + Value + Change + Trend
✅ Action Buttons: Icon + Label + Hover effect
✅ Status Badges: Color-coded + Icon
✅ Lists: Sortable + Filterable + Paginated
✅ Modals: Centered + Overlay + Animations
✅ Forms: Labels + Validation + Feedback
```

---

## 🚀 Implementation Priority

### **Phase 1: Core Dashboard** (Week 1)
- ✅ User Navigation (UserNav.tsx)
- ✅ Dashboard Home (WelcomeCard, StatsCard, QuickActions)
- ✅ Recent Activity Feed
- ✅ Basic Routing & Layout

### **Phase 2: Bookings** (Week 2)
- ✅ Booking List & Details
- ✅ Status Timeline
- ✅ Cancellation Flow
- ✅ Booking APIs

### **Phase 3: Profile & Settings** (Week 2)
- ✅ User Profile Card
- ✅ Edit Profile Form
- ✅ Avatar Upload (reuse admin logic)
- ✅ Settings Pages

### **Phase 4: Messages & Notifications** (Week 3)
- ✅ Conversation List
- ✅ Chat Interface (basic)
- ✅ Notification Center
- ✅ Notification Preferences

### **Phase 5: Reviews & Analytics** (Week 3)
- ✅ Review List & Write
- ✅ Review Analytics
- ✅ Booking Trends
- ✅ Spending Analytics

### **Phase 6: Polish & Optimization** (Week 4)
- ✅ Real-time updates (WebSocket)
- ✅ Performance optimization
- ✅ Mobile responsiveness
- ✅ Testing & QA

---

## 🔌 API Endpoints (To Be Created)

```
GET    /api/user/stats                    ← Dashboard stats
GET    /api/user/bookings                 ← Booking list
GET    /api/user/bookings/[id]            ← Booking detail
PATCH  /api/user/bookings/[id]/cancel     ← Cancel booking
GET    /api/user/saved                    ← Saved properties
POST   /api/user/saved                    ← Save property
DELETE /api/user/saved/[id]               ← Remove saved
GET    /api/user/messages                 ← Conversation list
GET    /api/user/messages/[id]            ← Conversation detail
POST   /api/user/messages/[id]            ← Send message
GET    /api/user/reviews                  ← User reviews
POST   /api/user/reviews                  ← Write review
PATCH  /api/user/reviews/[id]             ← Edit review
GET    /api/user/profile                  ← User profile
PATCH  /api/user/profile                  ← Update profile
POST   /api/user/profile/avatar           ← Upload avatar
GET    /api/user/notifications            ← Notifications
PATCH  /api/user/notifications/[id]/read  ← Mark as read
GET    /api/user/payments                 ← Payment history
GET    /api/user/payments/[id]            ← Payment detail
GET    /api/user/analytics/bookings       ← Booking trends
GET    /api/user/analytics/spending       ← Spending analytics
GET    /api/user/settings                 ← User settings
PATCH  /api/user/settings                 ← Update settings
```

---

## 📊 Key Metrics to Track

```
Dashboard:
- Page load time
- API response time
- User engagement (time spent)
- Click patterns

Bookings:
- Cancellation rate
- Time to complete booking flow
- Most viewed properties

Messages:
- Average response time
- Message read rate
- Conversation initiation rate

Reviews:
- Review completion rate
- Average rating given
- Sentiment distribution

Payments:
- Payment success rate
- Refund rate
- Preferred payment methods
```

---

## 🎯 Success Criteria

✅ All components follow admin/owner dashboard patterns
✅ Consistent UI/UX across all pages
✅ Fast load times (< 2s)
✅ Responsive on mobile, tablet, desktop
✅ Proper error handling & loading states
✅ Real-time updates where applicable
✅ Accessible (WCAG compliance)
✅ Comprehensive API coverage
✅ Security: Auth checks, data validation
✅ User satisfaction: Intuitive navigation

---

## 📝 Component Development Checklist

For each component:
- [ ] Props interface defined
- [ ] TypeScript types strict
- [ ] Responsive design
- [ ] Error states
- [ ] Loading states
- [ ] Empty states
- [ ] Accessibility (a11y)
- [ ] Unit tests
- [ ] Storybook stories (optional)
- [ ] API integration ready
- [ ] Error boundary wrapped
- [ ] Performance optimized

---

**Ready for Implementation!** 🚀

Each component follows the same architectural patterns as the Admin & Owner dashboards, ensuring consistency, maintainability, and scalability.
