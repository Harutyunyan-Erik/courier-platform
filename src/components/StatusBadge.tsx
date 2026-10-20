import type { ShipmentStatus } from "@prisma/client";
import { STATUS_TONE } from "@/lib/statuses";
import type { Dictionary } from "@/lib/i18n";

export function StatusBadge({ status, t }: { status: ShipmentStatus; t: Dictionary }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[status]}`}>
      {t.status[status]}
    </span>
  );
}
