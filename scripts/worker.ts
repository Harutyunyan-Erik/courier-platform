// Background worker: periodically pulls statuses from carrier APIs.
// Run alongside the web app: `npm run worker`.
import { syncAll } from "../src/lib/shipments";

const minutes = Number(process.env.SYNC_INTERVAL_MINUTES ?? 30);

async function tick() {
  const started = Date.now();
  try {
    const results = await syncAll();
    const errors = results.filter((r) => "error" in r).length;
    console.log(`[sync] ${results.length} shipments, ${errors} errors, ${Date.now() - started}ms`);
  } catch (err) {
    console.error("[sync] failed", err);
  }
}

console.log(`[sync] every ${minutes} min`);
void tick();
setInterval(tick, minutes * 60_000);
