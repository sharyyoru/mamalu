const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkResults() {
  // Get total count
  const { count: totalCount } = await supabase
    .from("newsletter_leads")
    .select("*", { count: "exact", head: true });

  // Get imported today count
  const today = new Date().toISOString().split("T")[0];
  const { count: importedToday } = await supabase
    .from("newsletter_leads")
    .select("*", { count: "exact", head: true })
    .gte("imported_at", today);

  // Get by status
  const { data: statusCounts } = await supabase
    .from("newsletter_leads")
    .select("status")
    .not("imported_at", "is", null);

  const statusMap = {};
  if (statusCounts) {
    statusCounts.forEach((r) => {
      statusMap[r.status] = (statusMap[r.status] || 0) + 1;
    });
  }

  // Get by import source
  const { data: sourceCounts } = await supabase
    .from("newsletter_leads")
    .select("import_source")
    .not("imported_at", "is", null);

  const sourceMap = {};
  if (sourceCounts) {
    sourceCounts.forEach((r) => {
      if (r.import_source) {
        sourceMap[r.import_source] = (sourceMap[r.import_source] || 0) + 1;
      }
    });
  }

  console.log("=".repeat(60));
  console.log("IMPORT RESULTS");
  console.log("=".repeat(60));
  console.log(`Total contacts in database: ${totalCount}`);
  console.log(`Imported today: ${importedToday}`);
  console.log("\nBy Status:");
  Object.entries(statusMap).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log("\nBy Source File:");
  Object.entries(sourceMap).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log("=".repeat(60));
}

checkResults().catch(console.error);
