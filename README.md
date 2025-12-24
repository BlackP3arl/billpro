# BillPro - ISP Bill Management System

Intelligent bill scanning and verification system for MTCC using Claude AI.

## Features

- 📄 **Drag-and-drop PDF upload** - Easy multi-file upload interface
- 🤖 **AI-powered extraction** - Claude 3.5 Sonnet Vision API extracts bill data
- 📊 **Account management** - Track service accounts and match bills automatically
- 📈 **Bill comparison** - Month-over-month analysis with smart alerts
- ⚠️ **Smart alerts** - Get notified when charges increase beyond threshold (default 20%)
- 📋 **Line item tracking** - Detailed service-level tracking for each bill

## Tech Stack

- **Frontend/Backend**: Next.js 15 with TypeScript
- **Database**: PostgreSQL
- **AI**: Anthropic Claude 3.5 Sonnet Vision API
- **UI**: Tailwind CSS + shadcn/ui
- **PDF Processing**: pdf2pic, pdf-lib

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ installed and running
- Anthropic API key (get from https://console.anthropic.com/)

### 2. Database Setup

```bash
# Create database
createdb billpro

# Run schema
psql billpro < lib/db/schema.sql
```

### 3. Environment Configuration

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add your keys:
# ANTHROPIC_API_KEY=sk-ant-your-key-here
# DATABASE_URL=postgresql://user:password@localhost:5432/billpro
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
billpro/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── bills/             # Bills pages
│   ├── accounts/          # Accounts pages
│   └── upload/            # Upload page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── bills/            # Bill-specific components
│   ├── accounts/         # Account components
│   └── dashboard/        # Dashboard widgets
├── lib/
│   ├── ai/               # Anthropic Claude integration
│   ├── db/               # Database client and schema
│   ├── pdf/              # PDF processing utilities
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── public/
│   ├── uploads/          # Uploaded bill PDFs
│   └── processed/        # Processed bills
└── docs/                 # Sample bills for testing
```

## Usage

### 1. Upload a Bill

1. Go to Upload page
2. Drag and drop PDF bill(s) or click to browse
3. System automatically processes and extracts data
4. Review extracted data and make corrections if needed

### 2. Register Service Accounts

- If bill account number is not recognized, system prompts to register
- Add account name, provider, and description
- All future bills for that account will be auto-matched

### 3. View Bills & Alerts

- Dashboard shows recent bills and active alerts
- Bills with >20% increase are automatically flagged
- Click on alerts to see detailed comparison

### 4. Compare Bills

- View side-by-side comparison of current vs previous month
- See line-by-line changes in service charges
- Identify new or removed services

## Database Schema

### Main Tables

- **service_accounts** - ISP service accounts (Dhiraagu, etc.)
- **bills** - Bill records with extracted data
- **line_items** - Individual services within each bill
- **alerts** - High charge alerts and notifications
- **app_settings** - Configuration (thresholds, etc.)
- **audit_logs** - Audit trail of changes

### Views

- **v_bills_summary** - Bills with account info
- **v_active_alerts** - Active alerts with details
- **v_account_stats** - Account statistics

## AI Extraction

The system uses Claude 3.5 Sonnet Vision API to:

1. Convert PDF to high-resolution images
2. Send images to Claude with structured prompt
3. Extract:
   - Account number
   - Invoice number
   - Billing period and dates
   - All financial data (charges, GST, outstanding, total)
   - Individual line items (phone numbers, packages, charges)
4. Validate extracted data
5. Store in database with confidence score

## Alert System

Alerts are automatically generated when:

- Bill total increases by ≥20% (configurable)
- New line items appear
- Unusual usage patterns detected

Alert severity levels:
- **Critical**: ≥50% increase
- **High**: ≥30% increase
- **Medium**: ≥20% increase (default threshold)

## API Routes

- `POST /api/upload` - Upload PDF bills
- `POST /api/process` - Process uploaded bill
- `GET /api/bills` - List all bills
- `GET /api/bills/[id]` - Get bill details
- `POST /api/accounts` - Create service account
- `GET /api/accounts` - List service accounts
- `GET /api/alerts` - Get active alerts
- `PATCH /api/alerts/[id]` - Acknowledge/resolve alert

## Testing

Sample bills are included in the `docs/` folder:

1. `57_18016895616018_BA11639924_B1-176644802.pdf` - Account BA11639924
2. `B1-180418655.pdf` - Account BA11790694

Use these to test the extraction and comparison features.

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

Proprietary - MTCC Internal Use Only

## Support

For issues or questions, contact the development team.
