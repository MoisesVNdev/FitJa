import { weekdays, type StoreHours, type Weekday } from "../../../../shared/contracts/operations";
import { storeHoursError, weekdayLabels } from "../../../../shared/domain/hours";
import { Notice } from "../../../shared/ui";

export default function HoursEditor({ hours, change }: { hours?: StoreHours; change: (value: StoreHours) => void }) {
  const current = hours ?? { days: {}, closures: [] };
  const error = storeHoursError(current);
  function update(day: Weekday, ranges: StoreHours["days"][Weekday]) {
    change({ ...current, days: { ...current.days, [day]: ranges } });
  }
  return (
    <section className="admin-card hours-editor">
      <h2>Horários de atendimento</h2>
      <p className="muted">Hora de Caruaru. As mudanças entram no ar ao publicar.</p>
      {weekdays.map((day) => {
        const ranges = current.days[day];
        return (
          <fieldset className="hours-day" key={day}>
            <legend>{weekdayLabels[day]}</legend>
            <label className="field">
              Atendimento
              <select value={ranges ? ranges.length ? "open" : "closed" : "unknown"} onChange={(event) => {
                const value = event.target.value;
                if (value === "unknown") {
                  const days = { ...current.days };
                  delete days[day];
                  change({ ...current, days });
                } else {
                  update(day, value === "closed" ? [] : [{ opens: "", closes: "" }]);
                }
              }}>
                <option value="unknown">A consultar</option>
                <option value="closed">Fechado</option>
                <option value="open">Horário definido</option>
              </select>
            </label>
            {ranges?.map((range, index) => (
              <div className="hours-range" key={index}>
                <label className="field">Abertura<input name={`${day}-opens-${index}`} type="time" value={range.opens} onChange={(event) => update(day, ranges.map((item, i) =>
                  i === index ? { ...item, opens: event.target.value } : item))} /></label>
                <label className="field">Fechamento<input name={`${day}-closes-${index}`} type="time" value={range.closes} onChange={(event) => update(day, ranges.map((item, i) =>
                  i === index ? { ...item, closes: event.target.value } : item))} /></label>
                <button type="button" className="text-button" onClick={() => update(day, ranges.filter((_, i) => i !== index))} aria-label={`Remover faixa ${index + 1} de ${weekdayLabels[day]}`}>Remover faixa</button>
              </div>
            ))}
            {!!ranges?.length && ranges.length < 6 && (
              <button type="button" className="text-button" onClick={() => update(day, [...ranges, { opens: "", closes: "" }])}>
                Adicionar faixa
              </button>
            )}
          </fieldset>
        );
      })}
      <h3>Feriados e imprevistos</h3>
      {current.closures.map((closure, index) => (
        <div className="hours-range" key={index}>
          <label className="field">Data de fechamento<input name={`closure-date-${index}`} type="date" value={closure.date} onChange={(event) => change({
            ...current, closures: current.closures.map((item, i) => i === index ? { ...item, date: event.target.value } : item),
          })} /></label>
          <label className="field">Aviso ao cliente<input name={`closure-notice-${index}`} maxLength={200} value={closure.notice} onChange={(event) => change({
            ...current, closures: current.closures.map((item, i) => i === index ? { ...item, notice: event.target.value } : item),
          })} /></label>
          <button type="button" className="text-button" onClick={() => change({
            ...current, closures: current.closures.filter((_, i) => i !== index),
          })}>Remover data</button>
        </div>
      ))}
      <button type="button" className="button secondary compact" disabled={current.closures.length >= 30} onClick={() => change({
        ...current, closures: [...current.closures, { date: "", notice: "" }],
      })}>Adicionar data excepcional</button>
      {error && <Notice error>{error}</Notice>}
    </section>
  );
}
