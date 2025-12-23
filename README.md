# Clinic Performance Dashboard (Billing Analyzer)

A Next.js application for analyzing medical billing CSV data locally using DuckDB WebAssembly. The app calculates key performance indicators (KPIs) and provides AI-powered interpretations using the Groq API.

## Features

- **Client-Side CSV Processing**: Process large medical billing datasets directly in the browser using DuckDB-WASM — no server upload required
- **Real-Time KPI Calculations**: Automatically computes essential revenue cycle metrics
- **AI-Powered Insights**: Leverages Groq's LLaMA 3.3 70B model to interpret KPI results
- **Privacy-First**: All data processing happens locally in your browser

## Project Structure

```
data-analyzer/
├── app/
│   ├── globals.css          # Global Tailwind CSS styles
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Main dashboard page
│   └── api/
│       └── kpis/
│           └── interpret/
│               └── route.ts # Groq API endpoint for KPI interpretation
├── hooks/
│   └── useDuckDB.ts         # Custom hook for DuckDB-WASM initialization
├── public/                  # Static assets
├── eslint.config.mjs        # ESLint configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
├── postcss.config.mjs       # PostCSS configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [DuckDB-WASM](https://duckdb.org/docs/api/wasm/overview) | In-browser SQL analytics engine |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS framework |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Groq API](https://groq.com/) | AI inference for KPI interpretation |

## KPIs Calculated

| Metric | Description |
|--------|-------------|
| **Total Claims** | Count of all billing records |
| **Total Billed** | Sum of all invoice amounts |
| **Total Paid** | Sum of all payments received |
| **Collection Rate** | Percentage of billed amount collected |
| **Revenue per Claim** | Average payment per claim |
| **Patient Responsibility %** | Percentage from copays, deductibles, coinsurance |
| **Insurance Collection %** | Percentage collected from insurance |
| **Avg Payment Days** | Average days between DOS and payment posting |

## Expected CSV Format

Your CSV file should contain the following columns:

| Column | Description |
|--------|-------------|
| `InvoiceAmount` | Billed amount for the claim |
| `Paid` | Amount paid |
| `PTCopay` | Patient copay amount |
| `deduct` | Deductible amount |
| `coins` | Coinsurance amount |
| `DOS` | Date of Service |
| `PostedDt` | Payment posted date |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shaun099/data_analyzer.git
   cd my-billing-analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create a .env.local file
   echo "GROQ_API_KEY=your_groq_api_key_here" > .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | API key for Groq AI interpretation service |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## How It Works

1. **Upload**: User uploads a medical billing CSV file
2. **Process**: DuckDB-WASM parses and analyzes the CSV entirely in the browser
3. **Calculate**: SQL queries compute all KPIs from the billing data
4. **Interpret**: Normalized KPIs are sent to the Groq API for AI-powered interpretation
5. **Display**: Dashboard shows KPI cards and AI-generated insights

## API Endpoints

### POST `/api/kpis/interpret`

Sends normalized KPIs to Groq for interpretation.

**Request Body:**
```json
{
  "kpis": {
    "totalClaims": 1000,
    "totalBilled": 150000,
    "totalPaid": 120000,
    "collectionRate": 80,
    "revenuePerClaim": 120,
    "patientResponsibilityPct": 15,
    "insuranceCollectionPct": 65,
    "avgPaymentDays": 30
  }
}
```

**Response:**
```json
{
  "bullets": [
    "The clinic processed 1,000 claims indicating...",
    "..."
  ]
}
```



## License

This project is private and not licensed for public distribution.

## Contributing

This is a private project. For internal contributions, please follow standard Git workflow practices.
