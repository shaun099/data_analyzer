"use client";
import { useState } from "react";
import { useDuckDB } from "@/hooks/useDuckDB";
import * as duckdb from "@duckdb/duckdb-wasm";
import { Activity, DollarSign, CheckCircle } from "lucide-react";

type Stats = {
  total_claims: number;
  total_billed: number;
  total_paid: number;

  collection_rate: number;
  revenue_per_claim: number;
  patient_responsibility_pct: number;
  insurance_collection_pct: number;
  avg_payment_days: number | null;
};

export default function BillingDashboard() {
  const db = useDuckDB();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [interpretation, setInterpretation] = useState<string[]>([]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    setLoading(true);
    setInterpretation([]);
    setStats(null);

    try {
      await db.registerFileHandle(
        "billing.csv",
        file,
        duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
        true
      );

      const conn = await db.connect();

      const result = await conn.query(`
        SELECT
          CAST(COUNT(*) AS DOUBLE) AS total_claims,

          SUM(CAST(InvoiceAmount AS DOUBLE)) AS total_billed,
          SUM(CAST(Paid AS DOUBLE)) AS total_paid,

          ROUND(
            SUM(CAST(Paid AS DOUBLE)) /
            NULLIF(SUM(CAST(InvoiceAmount AS DOUBLE)), 0) * 100,
            2
          ) AS collection_rate,

          ROUND(
            SUM(CAST(Paid AS DOUBLE)) /
            NULLIF(COUNT(*), 0),
            2
          ) AS revenue_per_claim,

          ROUND(
            SUM(
              CAST(PTCopay AS DOUBLE)
              + CAST(deduct AS DOUBLE)
              + CAST(coins AS DOUBLE)
            ) /
            NULLIF(SUM(CAST(InvoiceAmount AS DOUBLE)), 0) * 100,
            2
          ) AS patient_responsibility_pct,

          ROUND(
            (
              SUM(CAST(Paid AS DOUBLE)) -
              SUM(
                CAST(PTCopay AS DOUBLE)
                + CAST(deduct AS DOUBLE)
                + CAST(coins AS DOUBLE)
              )
            ) /
            NULLIF(SUM(CAST(InvoiceAmount AS DOUBLE)), 0) * 100,
            2
          ) AS insurance_collection_pct,

          AVG(CAST(PostedDt AS DATE) - CAST(DOS AS DATE)) AS avg_payment_days

        FROM 'billing.csv'
        WHERE PostedDt IS NOT NULL AND DOS IS NOT NULL
      `);

      const row = result.toArray()[0].toJSON() as Stats;
      setStats(row);
      console.log(row.total_billed);
      console.log(typeof row.total_claims);
      console.log(row.total_paid);

      // 🔹 Send ONLY normalized KPIs to Groq
      const normalizedKpis = {
        totalClaims: row.total_claims,
        totalBilled: row.total_billed,
        totalPaid: row.total_paid,
        collectionRate: row.collection_rate,
        revenuePerClaim: row.revenue_per_claim,
        patientResponsibilityPct: row.patient_responsibility_pct,
        insuranceCollectionPct: row.insurance_collection_pct,
        avgPaymentDays: row.avg_payment_days,
      };

      const aiRes = await fetch("/api/kpis/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kpis: normalizedKpis }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setInterpretation(aiData.bullets || []);
      }

      await conn.close();
    } catch (err) {
      console.error(err);
      alert("Error processing file. Check column names and formats.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          Clinic Performance Dashboard
        </h1>
        <p className="text-gray-600 mb-8">
          Process large-scale medical billing CSVs locally.
        </p>

        {/* Upload UI */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-10">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose file
          </label>

          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Click to upload</span> or drag &
              drop
            </div>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
          </label>

          {loading && (
            <p className="mt-3 text-blue-600 animate-pulse text-sm">
              Processing dataset…
            </p>
          )}
        </div>

        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Claims"
              value={stats.total_claims.toLocaleString()}
              icon={<Activity />}
            />
            <KPICard
              title="Total Billed"
              value={`$${stats.total_billed.toLocaleString()}`}
              icon={<DollarSign />}
            />
            <KPICard
              title="Total Paid"
              value={`$${stats.total_paid.toLocaleString()}`}
              icon={<CheckCircle />}
            />
            <KPICard
              title="Collection Rate"
              value={`${stats.collection_rate}%`}
              icon={<Activity />}
            />
            <KPICard
              title="Revenue / Claim"
              value={`$${stats.revenue_per_claim}`}
              icon={<DollarSign />}
            />
            <KPICard
              title="Patient Responsibility %"
              value={`${stats.patient_responsibility_pct}%`}
              icon={<Activity />}
            />
            <KPICard
              title="Insurance Collection %"
              value={`${stats.insurance_collection_pct}%`}
              icon={<Activity />}
            />
            <KPICard
              title="Avg Payment Days"
              value={
                stats.avg_payment_days
                  ? `${stats.avg_payment_days.toFixed(1)} days`
                  : "N/A"
              }
              icon={<Activity />}
            />
          </div>
        )}

        {/* Groq Interpretation */}
        {interpretation.length > 0 && (
          <div className="mt-10 bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-3">KPI Interpretation</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              {interpretation.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <div className="w-10 h-10 mb-3 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg">
        {icon}
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
