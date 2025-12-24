# BillPro Setup Guide

Complete setup instructions for the BillPro ISP Bill Management System.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 15 or higher ([Download](https://www.postgresql.org/download/))
- **Anthropic API Key** ([Get one here](https://console.anthropic.com/))

## Step 1: Clone/Navigate to Project

```bash
cd /Users/ahmedsalam/dev/billpro
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15
- React 19
- Anthropic SDK
- PostgreSQL client
- PDF processing libraries
- UI components

## Step 3: Set Up PostgreSQL Database

### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE billpro;

# Exit psql
\q
```

### Run Database Schema

```bash
# Run the schema file
psql billpro < lib/db/schema.sql
```

This creates all necessary tables:
- `service_accounts` - ISP service accounts
- `bills` - Bill records
- `line_items` - Individual services
- `alerts` - Alert notifications
- `app_settings` - Configuration
- `audit_logs` - Audit trail

And helpful views:
- `v_bills_summary` - Bills with account info
- `v_active_alerts` - Active alerts
- `v_account_stats` - Account statistics

### Verify Database Setup

```bash
psql billpro -c "\dt"
```

You should see all tables listed.

## Step 4: Configure Environment Variables

Edit the `.env.local` file:

```bash
# Open the file
nano .env.local

# Or use your preferred editor
code .env.local
```

Update the following values:

```env
# Your Anthropic API key (required)
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here

# Claude model to use (optional, default shown)
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Database connection string
# Format: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/billpro

# Application settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Get Your Anthropic API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)
6. Paste it in `.env.local`

## Step 5: Test Database Connection

Create a test script:

```bash
# Create test file
cat > test-db.js << 'EOF'
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function test() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].now);
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

test();
EOF

# Run test
node test-db.js

# Clean up
rm test-db.js
```

## Step 6: Create Required Directories

```bash
# Create upload and processing directories
mkdir -p public/uploads public/processed temp
```

## Step 7: Start Development Server

```bash
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000)

## Step 8: Test with Sample Bills

The project includes sample bills in the `docs/` folder:

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Upload Bill"
3. Drag and drop one of the sample PDFs from `docs/` folder
4. Watch as the system:
   - Uploads the PDF
   - Converts it to images
   - Sends to Claude for extraction
   - Stores data in database
   - Creates alerts if needed

## Step 9: Register Your First Service Account

When you upload your first bill:

1. System will detect unknown account number
2. You'll be prompted to register the account
3. Fill in:
   - **Account Name**: e.g., "MTCC Main Office"
   - **Provider**: e.g., "Dhiraagu"
   - **Description**: e.g., "Mobile services for main office"
4. Click "Register Account"
5. Bill will be processed and linked to this account

## Troubleshooting

### Database Connection Errors

**Error**: `ECONNREFUSED` or `connection refused`

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Use Services app to start PostgreSQL service
```

### PDF Processing Errors

**Error**: `pdf2pic` errors or GraphicsMagick not found

**Solution**:
```bash
# macOS
brew install graphicsmagick

# Linux (Ubuntu/Debian)
sudo apt-get install graphicsmagick

# Linux (RHEL/CentOS)
sudo yum install GraphicsMagick
```

### Anthropic API Errors

**Error**: `Invalid API key` or `Authentication failed`

**Solution**:
- Verify your API key in `.env.local`
- Ensure the key starts with `sk-ant-`
- Check you have credits in your Anthropic account
- Make sure there are no extra spaces in the `.env.local` file

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Use a different port
PORT=3001 npm run dev

# Or kill the process using port 3000
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Next Steps

1. **Upload Bills**: Start by uploading the sample bills from `docs/` folder
2. **Review Extractions**: Check the accuracy of AI-extracted data
3. **Register Accounts**: Add all your service accounts
4. **Configure Alerts**: Adjust the alert threshold in settings (default 20%)
5. **Process Monthly Bills**: Upload new bills each month for comparison

## Database Management

### Backup Database

```bash
pg_dump billpro > backup.sql
```

### Restore Database

```bash
psql billpro < backup.sql
```

### Reset Database

```bash
# Drop and recreate
dropdb billpro
createdb billpro
psql billpro < lib/db/schema.sql
```

### View Data

```bash
# Connect to database
psql billpro

# List accounts
SELECT * FROM service_accounts;

# List bills
SELECT * FROM v_bills_summary;

# List active alerts
SELECT * FROM v_active_alerts;

# Exit
\q
```

## Production Deployment

For production deployment:

1. Use a managed PostgreSQL service (e.g., AWS RDS, Heroku Postgres)
2. Set `NODE_ENV=production` in environment variables
3. Use proper database credentials and connection pooling
4. Enable SSL for database connections
5. Set up file storage (AWS S3, Azure Blob Storage)
6. Configure proper authentication and authorization
7. Set up monitoring and logging
8. Use environment-specific API keys

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs in the terminal
3. Check the browser console for client-side errors
4. Verify all environment variables are set correctly
5. Ensure all prerequisites are installed

## Additional Configuration

### Adjust Alert Threshold

The default alert threshold is 20%. To change it:

```sql
psql billpro -c "UPDATE app_settings SET value = '15' WHERE key = 'alert_threshold_percentage';"
```

### Change Maximum Upload Size

```sql
psql billpro -c "UPDATE app_settings SET value = '20' WHERE key = 'max_upload_size_mb';"
```

## Success Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 15+ installed and running
- [ ] Database `billpro` created
- [ ] Schema applied successfully
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` configured with Anthropic API key
- [ ] Database connection tested
- [ ] Development server starts without errors
- [ ] Sample bill processed successfully
- [ ] First service account registered

Once all items are checked, you're ready to use BillPro!
