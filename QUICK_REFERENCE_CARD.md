# 🎯 Quick Reference Card - Orbit PG

**Print this or bookmark it!**

---

## 🚀 Quick Commands

```bash
# Start development server
npm run dev

# Production build & start
npm run build && npm start

# Lint code
npm run lint

# Seed database
npm run seed
```

---

## 🌐 Important URLs

| Purpose | URL |
|---------|-----|
| **Local App** | http://localhost:3000 |
| **Network Access** | http://192.168.1.12:3000 |
| **GitHub Repo** | https://github.com/AmazingAkhil07/orbit |

---

## 📄 Documentation Files

### **Start Here** 🌟
| File | Purpose |
|------|---------|
| **TECH_STACK.md** | Complete tech reference (MAIN) |
| **QUICK_START.md** | Quick setup guide |
| **DOCUMENTATION_INDEX.md** | Find any documentation |

### **Feature Docs**
| File | Purpose |
|------|---------|
| BOOKING_WORKFLOW_COMPLETE.md | How booking works |
| ORBIT_PG_DATABASE_DOCUMENTATION.md | Database schema |
| API_AND_SERVICES_DOCUMENTATION.md | API endpoints |

### **Security & Admin**
| File | Purpose |
|------|---------|
| SECURITY_IMPLEMENTATION_GUIDE.md | Security details |
| ADMIN_DASHBOARD_COMPLETE.md | Admin features |

---

## 🛠️ Tech Stack at a Glance

### **Frontend**
```
React 19.2.1
Next.js 16.0.7
TypeScript 5
Tailwind CSS 4
Radix UI
```

### **Backend**
```
Next.js API Routes
Node.js
TypeScript 5
```

### **Database**
```
MongoDB 7.0.0
Mongoose 8.20.1
7 Models
```

### **Security**
```
NextAuth.js
bcryptjs
Zod Validation
Rate Limiting
```

---

## 📊 Key Stats

- **Dependencies:** 39 main + 13 dev
- **Database Models:** 7
- **API Endpoints:** 50+
- **TypeScript Coverage:** 95%+
- **Bundle Size:** < 150KB (gzipped)

---

## 🔑 Environment Variables

```env
# Required
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Optional
GOOGLE_GENERATIVE_AI_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
```

---

## 🎯 Common Tasks

### **Understanding the Project**
1. Read TECH_STACK.md
2. Check DOCUMENTATION_INDEX.md
3. Visit http://localhost:3000

### **Adding a New Feature**
1. Check API endpoints in TECH_STACK.md
2. Review database models in ORBIT_PG_DATABASE_DOCUMENTATION.md
3. Follow security patterns from SECURITY_IMPLEMENTATION_GUIDE.md

### **Fixing a Bug**
1. Check error in browser console
2. Review API response in Network tab
3. Check audit logs in database
4. Reference SECURITY_QUICK_REFERENCE.md

### **Deploying to Production**
1. Read deployment section in TECH_STACK.md
2. Set up environment variables
3. Run `npm run build`
4. Deploy to Vercel or AWS

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Server won't start | `rm -rf node_modules && npm install && npm run dev` |
| MongoDB error | Check MONGODB_URI in .env.local |
| Port 3000 in use | `PORT=3001 npm run dev` |
| TypeScript errors | `npm run build` to see full errors |
| Build hangs | `rm -rf .next && npm run build` |

---

## 📱 Key Endpoints

### **Auth**
```
POST /api/auth/[...nextauth]
```

### **Properties**
```
GET  /api/properties
POST /api/properties
```

### **Bookings**
```
GET    /api/bookings
POST   /api/bookings/create
POST   /api/bookings/cancel
GET    /api/owner/bookings
POST   /api/owner/bookings/accept
POST   /api/owner/bookings/reject
```

### **Messages & Reviews**
```
GET  /api/messages
POST /api/messages
GET  /api/reviews
POST /api/reviews
```

---

## 🔐 Security Checklist

Before deploying:
- [ ] Set NEXTAUTH_SECRET in production
- [ ] Use HTTPS only
- [ ] Enable CORS properly
- [ ] Check rate limits
- [ ] Review environment variables
- [ ] Test authentication flows
- [ ] Verify input validation
- [ ] Check audit logs

---

## 📚 Learning Paths

### **5-Minute Overview**
1. Read PROJECT_SUMMARY.md
2. Visit http://localhost:3000

### **30-Minute Quick Start**
1. Read TECH_STACK.md (dependencies section)
2. Read QUICK_START.md
3. Check DOCUMENTATION_INDEX.md

### **2-Hour Deep Dive**
1. Read TECH_STACK.md (complete)
2. Read ORBIT_PG_DATABASE_DOCUMENTATION.md
3. Read API_AND_SERVICES_DOCUMENTATION.md

### **Complete Understanding**
1. Read TECH_STACK.md
2. Read SECURITY_IMPLEMENTATION_GUIDE.md
3. Review `/src` folder structure
4. Explore API routes in `/src/app/api`

---

## 🎓 File Organization

```
Project Root/
├── src/
│   ├── app/api/          # API routes
│   ├── components/       # React components
│   ├── models/          # Mongoose schemas
│   ├── lib/             # Utilities
│   └── styles/          # CSS
├── public/              # Static files
├── TECH_STACK.md        # ⭐ Main tech reference
├── QUICK_START.md       # Quick guide
├── PROJECT_SUMMARY.md   # Overview
└── DOCUMENTATION_INDEX.md # Navigation
```

---

## 🚀 Deployment

### **To Vercel**
```bash
npm run build
vercel deploy
```

### **To AWS**
```bash
npm run build
# Push to GitHub
# Connect AWS CodeDeploy
```

### **To Railway**
```bash
# Connect GitHub repo
# Railway auto-deploys on push
```

---

## 💡 Pro Tips

1. **Use Turbopack** - Next.js 16 includes it, faster builds
2. **Check Audit Logs** - All actions are logged for debugging
3. **Test Locally First** - Use `npm run dev` before deploying
4. **Review Security Docs** - Essential for production
5. **Monitor Rate Limits** - Prevent abuse

---

## 📞 Quick Help

| Need Help With | Check This |
|----------------|-----------|
| Tech details | TECH_STACK.md |
| Getting started | QUICK_START.md |
| Finding docs | DOCUMENTATION_INDEX.md |
| Booking system | BOOKING_WORKFLOW_COMPLETE.md |
| Database | ORBIT_PG_DATABASE_DOCUMENTATION.md |
| APIs | API_AND_SERVICES_DOCUMENTATION.md |
| Security | SECURITY_IMPLEMENTATION_GUIDE.md |
| Admin tasks | ADMIN_DASHBOARD_COMPLETE.md |

---

## ✅ Server Status

```
✅ Running: http://localhost:3000
✅ Framework: Next.js 16.0.7 (Turbopack)
✅ Database: MongoDB (via .env.local MONGODB_URI)
✅ Auth: NextAuth.js (via .env.local NEXTAUTH_*)
✅ Ready: For development & testing
```

---

## 🎉 You're All Set!

- ✅ Tech stack documented
- ✅ Server running
- ✅ All commands available
- ✅ Docs well-organized
- ✅ Ready to build/deploy

**Happy coding!** 🚀

---

*Quick Reference | January 7, 2026 | Orbit PG v0.1.0*
