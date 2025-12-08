# 🚀 User Dashboard - Quick Reference & Testing Guide

## Quick Navigation Map

```
/dashboard                    → Main Dashboard Home
  ├── /bookings              → My Bookings List
  ├── /bookings/[id]         → Booking Detail (Ready to implement)
  ├── /saved                 → Saved Properties
  ├── /messages              → Messages/Chat
  ├── /reviews               → Reviews & Ratings
  ├── /payments              → Payment History
  ├── /profile               → User Profile
  ├── /notifications         → Notifications Center
  ├── /settings              → Account Settings
  └── /analytics             → Personal Analytics
```

---

## 🧩 Component Overview

### Layout Components (in `components/user/layout/`)
| Component | Purpose | Props |
|-----------|---------|-------|
| UserNav | Sidebar navigation | unreadCount, userName, userAvatar |
| UserLayoutContent | Main content wrapper | title, breadcrumbs, actions, children |

### Dashboard Components (in `components/user/dashboard/`)
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| WelcomeCard | Greeting section | Time-based greeting, next booking preview |
| UserStatsCard | Stats display | 6 metrics in grid layout |
| QuickActionButtons | 4 quick actions | Search, Book, Message, Review |
| RecentActivityFeed | Activity timeline | 6 activity types, relative timestamps |

### Feature Components (in `components/user/`)
| Component | Location | Purpose |
|-----------|----------|---------|
| BookingList | bookings/ | Display user bookings |
| UserProfileCard | profile/ | Display user info |

---

## 📡 API Endpoints

### Available Endpoints

```bash
# Get dashboard statistics
GET /api/user/stats
Response: {
  activeBookings: number,
  totalSpent: number,
  monthlySpent: number,
  averageRating: number,
  unreadMessages: number,
  pendingReviews: number,
  savedProperties: number
}

# Get user bookings
GET /api/user/bookings?filter=all&limit=10&skip=0
Response: {
  bookings: BookingItem[],
  total: number,
  page: number,
  pages: number
}

# Get single booking
GET /api/user/bookings/[id]
Response: Booking (fully populated with property & owner)
```

### Query Parameters

**GET /api/user/bookings**:
- `filter` - 'all' | 'active' | 'completed' | 'cancelled'
- `limit` - Number of items per page (default: 10)
- `skip` - Number of items to skip (default: 0)

---

## 🎯 Testing the Dashboard

### 1. **Test Navigation**
```
1. Log in as a student user
2. Navigate to /dashboard
3. Test all navigation items in sidebar
4. Test minimize/expand button
5. Test mobile hamburger menu
```

### 2. **Test Dashboard Home**
```
1. Verify welcome card shows correct name & greeting
2. Check stats display (should show 0 for new users)
3. Test quick action buttons (should navigate or trigger modals)
4. Verify recent activity feed appears (empty for new users)
```

### 3. **Test Bookings Page**
```
1. Navigate to /dashboard/bookings
2. Should show "No Bookings Yet" for new users
3. Make a test booking via /search
4. Return to /dashboard/bookings
5. Verify booking appears in list
6. Click "Details" button
7. Verify booking detail loads
```

### 4. **Test Profile Page**
```
1. Navigate to /dashboard/profile
2. Verify user information displays correctly
3. Check verification badge appears if verified
4. Verify stats show 0 for new users
5. Click "Settings" button
```

### 5. **Test Empty States**
```
Visit each empty page:
- /dashboard/saved → Shows "No Saved Properties"
- /dashboard/messages → Shows "No Messages Yet"
- /dashboard/reviews → Shows "No Reviews Yet"
- /dashboard/payments → Shows "No Payments Yet"
- /dashboard/notifications → Shows "No Notifications"
- /dashboard/analytics → Shows "No Analytics Data Yet"
- /dashboard/settings → Shows feature categories
```

---

## 🔗 Integration Checklist

### Connected to Existing Systems:
✅ NextAuth.js for authentication
✅ MongoDB for data persistence
✅ Mongoose models (User, Booking, Property)
✅ Existing Tailwind CSS setup
✅ Existing UI component library
✅ Lucide React icons
✅ Next.js App Router

### Data Flow:
```
User Session → User.findOne()
    ↓
getServerSession() → Verify auth
    ↓
Database Query → Fetch stats/bookings
    ↓
Component Props → Display data
    ↓
User Interaction → API Call
    ↓
Update State/Redirect
```

---

## 🎨 Styling Notes

### Responsive Design
- Mobile-first approach
- Tailwind breakpoints: `sm:` `md:` `lg:` `xl:`
- Sidebar collapses on mobile
- Grid layouts adjust: 1 col → 2 col → 3+ col

### Color Scheme
```
Primary Blue:    #3B82F6 (Bookings)
Secondary:       #8B5CF6 (Saved/Secondary)
Success Green:   #10B981 (Messages/Complete)
Warning Amber:   #FBBF24 (Spending)
Danger Red:      #EF4444 (Cancellations)
Neutral Slate:   #64748B (Backgrounds)
```

### Spacing
- Section gaps: `gap-6` to `gap-8`
- Card padding: `p-6` to `p-8`
- Border radius: `rounded-xl` (12px)
- Border color: `border-slate-200`

---

## 📋 Implementation Sequence (Phase 2)

### Week 1: Core Features
1. **Booking Details Page**
   - Create `/dashboard/bookings/[id]/page.tsx`
   - Build `BookingDetailCard.tsx`
   - Build `BookingStatusTimeline.tsx`
   - Add cancel booking modal

2. **Saved Properties**
   - Build `SavedPropertiesList.tsx`
   - Build `SavedPropertyFilters.tsx`
   - Create SavedProperty model

### Week 2: Messaging & Reviews
1. **Messages**
   - Build `ConversationList.tsx`
   - Build `ChatInterface.tsx`
   - Set up WebSocket for real-time
   - Create Message model

2. **Reviews**
   - Build `ReviewList.tsx`
   - Build `WriteReviewModal.tsx`
   - Build `ReviewAnalytics.tsx`
   - Create Review model

### Week 3: Payments & Settings
1. **Payments**
   - Build `PaymentHistoryTable.tsx`
   - Build `PaymentReceiptModal.tsx`
   - Create PDF export

2. **Settings**
   - Build `AccountSettings.tsx`
   - Build `PrivacySettings.tsx`
   - Build `AvatarUploadSection.tsx`

### Week 4: Analytics & Polish
1. **Analytics**
   - Build charts with Chart.js/Recharts
   - Implement trends & metrics

2. **Polish**
   - Performance optimization
   - Error boundary wrapping
   - Loading states
   - Testing & QA

---

## 🛠️ How to Extend

### Adding a New Dashboard Feature

1. **Create Component**
   ```tsx
   // src/components/user/feature/FeatureComponent.tsx
   'use client';
   export default function FeatureComponent(props) {
     return <div>...</div>;
   }
   ```

2. **Create Page**
   ```tsx
   // src/app/dashboard/feature/page.tsx
   import FeatureComponent from '@/components/user/feature/FeatureComponent';
   
   export const dynamic = 'force-dynamic';
   
   export default async function FeaturePage() {
     return (
       <UserLayoutContent title="Feature">
         <FeatureComponent />
       </UserLayoutContent>
     );
   }
   ```

3. **Create API (if needed)**
   ```tsx
   // src/app/api/user/feature/route.ts
   export async function GET(req: NextRequest) {
     // Implementation
   }
   ```

4. **Add Navigation Item**
   ```tsx
   // In src/components/user/layout/UserNav.tsx
   navItems.push({
     label: 'Feature',
     href: '/dashboard/feature',
     icon: FeatureIcon,
     badge: 0,
   });
   ```

---

## 📊 Database Schemas Used

### User Model
```typescript
{
  name: string,
  email: string,
  image?: string,
  role: 'user' | 'owner' | 'admin',
  phone?: string,
  university?: string,
  isVerified: boolean,
  blacklisted: boolean
}
```

### Booking Model
```typescript
{
  studentId: ObjectId (ref: User),
  propertyId: ObjectId (ref: Property),
  status: 'pending' | 'paid' | 'confirmed' | 'rejected',
  amountPaid: number,
  paymentId?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Property Model (partial)
```typescript
{
  title: string,
  slug: string,
  images: string[],
  location: {
    address: string,
    lat: number,
    lng: number
  },
  ownerId: ObjectId (ref: User),
  approvalStatus: 'pending' | 'approved' | 'rejected'
}
```

---

## ⚡ Performance Tips

### Optimization Done:
✅ Server-side rendering for auth checks
✅ Lean MongoDB queries (select specific fields)
✅ Image lazy loading
✅ Component code splitting
✅ CSS in Tailwind (no runtime overhead)

### Future Optimizations:
- Add pagination to booking list (25 items)
- Implement caching with React Query
- Image optimization with Next.js Image
- Database indexing on frequently queried fields
- Redis caching for stats

---

## 🐛 Debugging Tips

### Check Session:
```tsx
const session = await getServerSession(authOptions);
console.log('Session:', session?.user?.email);
```

### Check Database Connection:
```tsx
await dbConnect();
const users = await User.countDocuments();
console.log('DB Users:', users);
```

### Check API Response:
```bash
curl http://localhost:3000/api/user/stats
```

### Check Types:
```bash
npm run build  # Will show TypeScript errors
```

---

## 📚 Related Documentation

- **Admin Dashboard**: `/ADMIN_DASHBOARD_COMPLETE.md`
- **Owner Dashboard**: `/OWNER_DASHBOARD_ARCHITECTURE.md`
- **User Dashboard Architecture**: `/USER_DASHBOARD_ARCHITECTURE.md`
- **Database Guide**: `/ORBIT_PG_DATABASE_DOCUMENTATION.md`

---

## ✅ Checklist for Developers

Before deploying Phase 2 features:

- [ ] All components use TypeScript strict mode
- [ ] PropTypes or interfaces defined
- [ ] Error boundaries added
- [ ] Loading states implemented
- [ ] Empty states handled
- [ ] Mobile responsive tested
- [ ] API errors handled
- [ ] Security checks in place
- [ ] No console warnings
- [ ] Unit tests written (optional)
- [ ] Build passes: `npm run build`
- [ ] Dev server works: `npm run dev`

---

**Happy Coding!** 🚀
