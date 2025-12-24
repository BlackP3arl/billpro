# BillPro Project Summary

## 🎯 Project Overview

**BillPro** is an intelligent ISP bill management and verification system built for MTCC. It automates the processing of telecom bills from providers like Dhiraagu using AI-powered data extraction.

### Key Features
- 📄 Drag-and-drop PDF bill uploads
- 🤖 **Claude 3.5 Sonnet Vision AI** for intelligent data extraction
- 📊 Automatic account matching and bill comparison
- ⚠️ Smart alerts for high charges (configurable 20% threshold)
- 📈 Line-item tracking for detailed cost analysis
- 🗄️ PostgreSQL database for robust data storage

## 📁 Project Structure

```
billpro/
├── app/                          # Next.js pages and API routes
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home dashboard
│   ├── globals.css              # Global styles
│   └── api/                     # API routes (TO BE CREATED)
│       ├── upload/              # File upload
│       ├── process/             # Bill processing
│       ├── bills/               # Bills CRUD
│       ├── accounts/            # Accounts CRUD
│       └── alerts/              # Alerts management
├── components/                   # React components (TO BE CREATED)
│   ├── ui/                      # Base UI components
│   ├── bills/                   # Bill-specific components
│   ├── accounts/                # Account components
│   └── dashboard/               # Dashboard widgets
├── lib/
│   ├── ai/                      # ✅ Anthropic Claude integration
│   │   ├── anthropic-client.ts # Claude SDK setup
│   │   ├── prompts.ts          # Extraction prompts
│   │   └── bill-extractor.ts   # Vision API integration
│   ├── db/                      # ✅ Database
│   │   ├── schema.sql          # Complete PostgreSQL schema
│   │   └── client.ts           # Connection pooling
│   ├── pdf/                     # ✅ PDF processing
│   │   ├── pdf-to-image.ts     # Conversion utilities
│   │   └── pdf-processor.ts    # Processing pipeline
│   ├── services/                # ✅ Business logic (partial)
│   │   ├── account-service.ts  # Account management
│   │   ├── alert-service.ts    # Alert detection
│   │   └── bill-service.ts     # TO BE CREATED
│   ├── types/                   # ✅ TypeScript definitions
│   │   ├── bill.ts
│   │   ├── account.ts
│   │   ├── line-item.ts
│   │   └── alert.ts
│   └── utils/                   # ✅ Utilities
│       └── cn.ts               # ClassName helper
├── public/
│   ├── uploads/                 # Uploaded PDFs
│   ├── processed/               # Processed PDFs
│   └── temp/                    # Temporary files
├── docs/                        # ✅ Sample bills for testing
│   ├── 57_18016895616018_BA11639924_B1-176644802.pdf
│   └── B1-180418655.pdf
├── .env.local                   # ✅ Environment configuration
├── README.md                    # ✅ Project documentation
├── SETUP.md                     # ✅ Setup instructions
└── IMPLEMENTATION_STATUS.md     # ✅ Development progress
```

## ✅ Completed Work (~40% of project)

### 1. Foundation & Configuration
- [x] Next.js 15 + TypeScript project setup
- [x] Tailwind CSS + PostCSS configuration
- [x] Dependencies installed (Anthropic SDK, PostgreSQL, PDF libraries)
- [x] Environment configuration files
- [x] Git ignore rules
- [x] Project structure created

### 2. Database
- [x] Complete PostgreSQL schema with:
  - `service_accounts` table
  - `bills` table with full metadata
  - `line_items` table for detailed tracking
  - `alerts` table for notifications
  - `app_settings` table for configuration
  - `audit_logs` table for tracking changes
- [x] Optimized indexes for performance
- [x] Helper views (bills_summary, active_alerts, account_stats)
- [x] Auto-update triggers for timestamps
- [x] Default settings (20% alert threshold)
- [x] Database client with connection pooling

### 3. AI Integration (Anthropic Claude)
- [x] Anthropic SDK setup
- [x] Claude 3.5 Sonnet Vision API integration
- [x] Structured prompts for bill extraction
- [x] Single-page PDF extraction
- [x] Multi-page PDF extraction
- [x] JSON validation and error handling
- [x] Confidence scoring

### 4. PDF Processing
- [x] PDF to image conversion (high-res)
- [x] Multi-page PDF support
- [x] Page count detection
- [x] File validation
- [x] Upload/processing folder management
- [x] Cleanup utilities
- [x] File size limits

### 5. Business Logic Services
- [x] Account Service (complete)
  - Get/create/update/delete accounts
  - Account existence checking
  - Statistics views
- [x] Alert Service (complete)
  - Alert detection algorithm
  - Severity calculation (low/medium/high/critical)
  - Acknowledge/resolve/dismiss alerts
  - Alert queries
- [ ] Bill Service (NOT YET CREATED - Priority #1)
- [ ] Line Item Service (NOT YET CREATED)

### 6. Type Definitions
- [x] Complete TypeScript interfaces for:
  - Bills and extraction results
  - Service accounts
  - Line items
  - Alerts
  - Processing status enums

### 7. Documentation
- [x] Comprehensive README
- [x] Detailed SETUP guide
- [x] Implementation status tracking
- [x] Code comments and documentation

### 8. Basic UI
- [x] App layout with header/footer
- [x] Home page with overview
- [x] Global CSS with design system
- [x] Tailwind theme configuration

## 🚧 Remaining Work (~60% of project)

### Priority 1: Core Functionality (Week 1)
1. **Bill Service** (`lib/services/bill-service.ts`)
   - CRUD operations for bills
   - Bill comparison logic
   - Query functions

2. **Upload API** (`app/api/upload/route.ts`)
   - Handle file uploads
   - Save to storage
   - Return upload status

3. **Process API** (`app/api/process/route.ts`)
   - Orchestrate bill processing
   - Call PDF processor
   - Call AI extractor
   - Save to database
   - Generate alerts

4. **Bills API** (`app/api/bills/route.ts`)
   - GET list of bills
   - GET single bill
   - UPDATE bill
   - DELETE bill

5. **Accounts API** (`app/api/accounts/route.ts`)
   - GET list of accounts
   - POST create account
   - GET account details
   - UPDATE account

### Priority 2: User Interface (Week 2-3)
6. **Base UI Components** (`components/ui/`)
   - Button
   - Card
   - Dialog/Modal
   - Input
   - Table
   - Alert/Badge

7. **Bill Upload Component** (`components/bills/BillUploadZone.tsx`)
   - Drag-and-drop zone
   - File selection
   - Upload progress
   - Error handling

8. **Account Registration Modal** (`components/accounts/AccountRegistrationModal.tsx`)
   - Form for new accounts
   - Validation
   - Submit handler

9. **Upload Page** (`app/upload/page.tsx`)
   - Upload interface
   - Processing status
   - Success/error messages

10. **Bills Page** (`app/bills/page.tsx`)
    - List all bills
    - Filtering
    - Sorting

11. **Accounts Page** (`app/accounts/page.tsx`)
    - List all accounts
    - Stats display
    - Quick actions

### Priority 3: Enhanced Features (Week 4)
12. **Bill Viewer** - PDF + extracted data side-by-side
13. **Bill Comparison** - Current vs previous month
14. **Alerts Dashboard** - Prominent alert display
15. **Data Editor** - Manual correction of AI extractions
16. **Settings Page** - Configure thresholds
17. **Charts** - Month-over-month visualization

## 🗄️ Database Schema

### Tables Created

1. **service_accounts** - ISP service accounts
   - account_number (unique)
   - account_name
   - provider (Dhiraagu, etc.)
   - description
   - is_active

2. **bills** - Bill records
   - invoice_number (unique)
   - service_account_id (FK)
   - billing period dates
   - financial data (charges, GST, outstanding, total)
   - file information
   - processing status
   - AI confidence score
   - extracted raw data (JSONB)

3. **line_items** - Individual services
   - bill_id (FK)
   - service_number (phone/SIM)
   - package_name
   - charges breakdown
   - usage details (JSONB)

4. **alerts** - Notifications
   - bill_id, service_account_id (FKs)
   - alert_type, severity
   - current/previous amounts
   - percentage increase
   - status (active/acknowledged/resolved)

5. **app_settings** - Configuration
   - key/value pairs
   - Default: alert_threshold_percentage = 20

6. **audit_logs** - Change tracking
   - entity_type, entity_id
   - action, changes
   - timestamp

## 🤖 AI Extraction Process

The system uses **Claude 3.5 Sonnet Vision API** to extract bill data:

1. **Upload**: User uploads PDF bill
2. **Convert**: PDF → High-res PNG images (200 DPI, 2400x3200px)
3. **Extract**: Images sent to Claude Vision API with structured prompt
4. **Parse**: Claude returns JSON with all bill data:
   ```json
   {
     "accountNumber": "BA11639924",
     "invoiceNumber": "B1-176644802",
     "billingPeriodStart": "2025-09-01",
     "billingPeriodEnd": "2025-09-30",
     "billDate": "2025-09-30",
     "currentCharges": 14878.67,
     "outstanding": 0,
     "totalDue": 16069.16,
     "gstAmount": 1190.49,
     "lineItems": [
       {
         "serviceNumber": "7951234",
         "packageName": "Postpaid 150",
         "subscriptionCharge": 150,
         "usageCharges": 25.50,
         "totalCharge": 175.50
       },
       // ... more line items
     ],
     "confidence": 95
   }
   ```
5. **Validate**: System validates extracted data
6. **Match**: Check if account exists in database
7. **Store**: Save bill and line items
8. **Compare**: Compare with previous bill for same account
9. **Alert**: Generate alerts if charges increased >20%

## ⚙️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 15.1.6 |
| Runtime | Node.js | 18+ |
| Language | TypeScript | 5.7.2 |
| Database | PostgreSQL | 15+ |
| ORM | pg (node-postgres) | 8.13.1 |
| AI | Anthropic Claude | 3.5 Sonnet |
| PDF Processing | pdf2pic, pdf-lib | Latest |
| UI Framework | React | 19.0.0 |
| Styling | Tailwind CSS | 3.4.17 |
| State Management | TanStack Query | 5.62.11 |
| Forms | React Hook Form | 7.54.2 |
| Validation | Zod | 3.24.1 |
| Icons | Lucide React | 0.468.0 |

## 🚀 Getting Started

### Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up PostgreSQL
createdb billpro
psql billpro < lib/db/schema.sql

# 3. Configure environment
# Edit .env.local with your Anthropic API key and database URL

# 4. Start development server
npm run dev
```

### Detailed Setup

See [SETUP.md](SETUP.md) for complete instructions including:
- Prerequisites installation
- Database configuration
- Environment variables
- Troubleshooting
- Testing with sample bills

## 📊 Current Status

**Overall Progress**: ~40% complete

| Phase | Status | Completion |
|-------|--------|-----------|
| Foundation | ✅ Complete | 100% |
| Database | ✅ Complete | 100% |
| AI Integration | ✅ Complete | 100% |
| PDF Processing | ✅ Complete | 100% |
| Services | 🚧 In Progress | 60% |
| API Routes | ⏳ Not Started | 0% |
| UI Components | ⏳ Not Started | 5% |
| Pages | ⏳ Not Started | 20% |
| Testing | ⏳ Not Started | 0% |

## 🎯 Next Steps

### Immediate (Next Session)
1. Create `lib/services/bill-service.ts`
2. Create `app/api/upload/route.ts`
3. Create `app/api/process/route.ts`
4. Test upload and processing with sample bills

### Short Term (This Week)
5. Create base UI components
6. Create upload page and component
7. Create bills/accounts APIs
8. Create bills/accounts pages
9. End-to-end testing

### Medium Term (Next 2-3 Weeks)
10. Bill viewer with PDF display
11. Bill comparison feature
12. Alert dashboard
13. Data editing capabilities
14. Settings configuration
15. Comprehensive testing

## 📝 Important Files

### Must Read
- [README.md](README.md) - Project overview and features
- [SETUP.md](SETUP.md) - Detailed setup guide
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Development progress

### Configuration
- `.env.local` - Environment variables (edit with your API keys)
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - UI styling

### Core Code
- `lib/db/schema.sql` - Database schema
- `lib/ai/bill-extractor.ts` - AI extraction logic
- `lib/pdf/pdf-processor.ts` - PDF processing
- `lib/services/account-service.ts` - Account management
- `lib/services/alert-service.ts` - Alert detection

### Sample Data
- `docs/57_18016895616018_BA11639924_B1-176644802.pdf` - Sample bill 1
- `docs/B1-180418655.pdf` - Sample bill 2

## 💡 Key Design Decisions

1. **Anthropic Claude over OpenAI**: Better document understanding, cost-effective
2. **PostgreSQL over MongoDB**: Structured data suits relational model
3. **Next.js App Router**: Modern, server components, API routes in one
4. **JSONB for flexibility**: Store raw extraction data for future analysis
5. **Views for complex queries**: Optimize common data retrieval
6. **Service layer pattern**: Separate business logic from API routes
7. **Type-safe throughout**: TypeScript for fewer bugs

## 🔒 Security Considerations

- API key stored in environment variables (never committed)
- File upload validation (type, size)
- SQL injection protection (parameterized queries)
- Input sanitization required for production
- Authentication needed for production deployment
- Rate limiting should be added to APIs

## 🐛 Known Limitations

- No user authentication yet (single-user system)
- No real-time progress updates during processing
- File storage is local (use cloud storage for production)
- No email notifications
- Manual database setup required
- GraphicsMagick dependency for PDF processing

## 📈 Future Enhancements

- Multi-user support with authentication
- Role-based access control
- Email/SMS notifications for alerts
- Automated bill download from ISP portals
- Budget tracking and forecasting
- Export to Excel/PDF reports
- Mobile app
- Webhook integrations
- API for third-party integrations

## 🙏 Credits

- Built with Next.js, React, and TypeScript
- AI powered by Anthropic Claude
- UI components inspired by shadcn/ui
- Database: PostgreSQL
- Developed for MTCC

## 📞 Support

For setup issues or questions:
1. Check [SETUP.md](SETUP.md) troubleshooting section
2. Review [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
3. Check environment variables in `.env.local`
4. Verify database connection
5. Test with sample bills in `docs/` folder

---

**Last Updated**: December 24, 2025
**Version**: 0.1.0 (Alpha)
**Status**: Foundation Complete - Ready for MVP Development
