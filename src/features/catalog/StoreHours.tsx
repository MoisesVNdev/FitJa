import { useEffect, useState } from "react";
import type { Catalog } from "../../../shared/domain";
import { weekdays } from "../../../shared/contracts/operations";
import { storeHoursStatus, weekdayLabels } from "../../../shared/domain/hours";

export function useHoursStatus(catalog: Catalog | null) {
  const [now, setNow] = useState(() => new Date());
  const hasSchedule = !!catalog?.storeHours;
  useEffect(() => {
    if (!hasSchedule) return;
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 30_000);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, [hasSchedule]);
  return storeHoursStatus(catalog?.storeHours, now);
}

export function StoreHours({ catalog, status }: { catalog: Catalog; status: ReturnType<typeof storeHoursStatus> }) {
  const schedule = catalog.storeHours;
  const days = weekdays.filter((day) => schedule?.days[day]);
  return (
    <div className="store-hours">
      <p>{status.text}</p>
      {!schedule && catalog.hours.trim() && <p>{catalog.hours}</p>}
      {schedule && days.length > 0 && (
        <details>
          <summary>Dias e horários</summary>
          <dl>
            {days.map((day) => {
              const ranges = schedule.days[day] ?? [];
              return <div key={day}><dt>{weekdayLabels[day]}</dt><dd>{ranges.length
                ? ranges.map((range) => `${range.opens}–${range.closes}`).join(", ")
                : "Fechado"}</dd></div>;
            })}
          </dl>
        </details>
      )}
    </div>
  );
}
