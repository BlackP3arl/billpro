# BillPro Quick Start Guide

Get BillPro up and running in 10 minutes!

## ✅ Pre-Setup Checklist

Before you begin, make sure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 15+ installed (`postgres --version`)
- [ ] Anthropic API key ([Get one here](https://console.anthropic.com/))
- [ ] GraphicsMagick installed (for PDF processing)

### Install GraphicsMagick

**macOS**:
```bash
brew install graphicsmagick
```

**Ubuntu/Debian**:
```bash
sudo apt-get install graphicsmagick
```

**Windows**:
Download from [http://www.graphicsmagick.org/](http://www.graphicsmagick.org/)

## 🚀 5-Step Setup

### Step 1: Install Dependencies (2 min)
```bash
cd /Users/ahmedsalam/dev/billpro
npm install
```

### Step 2: Create Database (1 min)
```bash
# Create database
createdb billpro

# Apply schema
psql billpro < lib/db/schema.sql
```

### Step 3: Configure Environment (1 min)
```bash
# Edit .env.local file
nano .env.local
```

Update these two critical lines:
```env
ANTHROPIC_API_KEY=sk-ant-YOUR-ACTUAL-KEY-HERE
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/billpro
```

### Step 4: Test Database Connection (1 min)
```bash
psql billpro -c "SELECT COUNT(*) FROM service_accounts;"
```

Expected output: `count` should be `0` (no accounts yet)

### Step 5: Start Development Server (1 min)
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Development server starts without errors
- [ ] Home page loads at http://localhost:3000
- [ ] No console errors in browser
- [ ] No errors in terminal

## 🎯 What Works Now

The following is **already implemented and working**:

✅ **AI Extraction Engine**
- PDF to image conversion
- Claude Vision API integration
- Structured data extraction
- Multi-page PDF support

✅ **Database**
- Complete schema
- All tables created
- Optimized indexes
- Helper views

✅ **Services**
- Account management (create, read, update, delete)
- Alert detection and management
- Percentage-based alert thresholds

✅ **PDF Processing**
- High-quality PDF to image conversion
- File validation
- Upload/processed folder management

## 🚧 What Needs to Be Built

To have a working MVP, you need to create:

### Critical (Week 1)
1. **Bill Service** (`lib/services/bill-service.ts`)
   - Functions to save/retrieve bills from database

2. **Upload API** (`app/api/upload/route.ts`)
   - Handle PDF file uploads

3. **Process API** (`app/api/process/route.ts`)
   - Orchestrate: PDF → Images → AI → Database

4. **Upload Page** (`app/upload/page.tsx`)
   - Drag-and-drop interface

### Important (Week 2)
5. **UI Components** (`components/ui/`)
   - Button, Card, Dialog, Input, Table

6. **Bills API & Page**
   - List and view bills

7. **Accounts API & Page**
   - Manage service accounts

## 📝 Quick Test with Sample Bills

Once the upload functionality is built, test with:

```bash
# Sample bills are in docs/ folder
ls -la docs/

# Two Dhiraagu bills included:
# 1. docs/57_18016895616018_BA11639924_B1-176644802.pdf
# 2. docs/B1-180418655.pdf
```

These bills will:
- Test AI extraction accuracy
- Test line item parsing
- Provide data for comparison features

## 🆘 Troubleshooting

### Error: "Cannot connect to database"
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

### Error: "ANTHROPIC_API_KEY is not defined"
- Edit `.env.local`
- Ensure no spaces around the `=`
- Key should start with `sk-ant-`

### Error: "pdf2pic failed" or "GraphicsMagick not found"
```bash
# Install GraphicsMagick
brew install graphicsmagick  # macOS
sudo apt-get install graphicsmagick  # Linux
```

### Error: "Port 3000 already in use"
```bash
# Kill the process or use different port
PORT=3001 npm run dev
```

## 📚 Documentation

- **README.md** - Project overview
- **SETUP.md** - Detailed setup instructions
- **IMPLEMENTATION_STATUS.md** - What's done and what's next
- **PROJECT_SUMMARY.md** - Complete project summary

## 🎓 Learning the Codebase

### Key Files to Understand

1. **AI Extraction**: `lib/ai/bill-extractor.ts`
   - See how Claude Vision API works
   - Understand the extraction prompt

2. **Database Schema**: `lib/db/schema.sql`
   - All tables and relationships
   - Views for common queries

3. **PDF Processing**: `lib/pdf/pdf-processor.ts`
   - PDF → Image conversion
   - File handling

4. **Account Service**: `lib/services/account-service.ts`
   - Example of service layer pattern
   - Database queries

## 🔄 Development Workflow

1. **Make Changes** - Edit code
2. **Auto-Reload** - Next.js hot-reloads changes
3. **Check Browser** - See results immediately
4. **Check Terminal** - Watch for errors
5. **Test** - Upload sample bills

## 💡 Pro Tips

1. **Keep Terminal Open** - Watch for errors and logs
2. **Use Browser DevTools** - Check console for errors
3. **Test Database Directly** - Use `psql billpro` to query data
4. **Start Simple** - Get upload working first, then add features
5. **Use Sample Bills** - Test with provided Dhiraagu bills

## 🎯 Success Criteria

You'll know setup is successful when:
- ✅ Server starts without errors
- ✅ Home page loads and looks good
- ✅ Database has all tables
- ✅ No errors in browser console
- ✅ You can navigate to /bills and /accounts (even if empty)

## 🚀 Next Steps After Setup

1. **Create Bill Service** - Core data operations
2. **Create Upload API** - Handle file uploads
3. **Create Process API** - Orchestrate bill processing
4. **Test with Sample Bills** - Verify AI extraction works
5. **Build UI** - Create upload interface

## 📞 Need Help?

Check these in order:
1. Error messages in terminal
2. Browser console (F12)
3. SETUP.md troubleshooting section
4. Database connection with `psql billpro`
5. Environment variables in `.env.local`

## 🎉 You're Ready!

If all steps completed successfully:
- ✅ Foundation is solid
- ✅ All infrastructure is in place
- ✅ AI extraction is ready to use
- ✅ Database is configured
- ⏭️ Ready to build the MVP

Start building the upload functionality next!
