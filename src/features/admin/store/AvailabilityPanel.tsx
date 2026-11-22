import { useState } from "react";
import type { AvailabilityChange } from "../../../../shared/contracts/operations";
import { productInStock, variantInStock, variantLabel, type Catalog } from "../../../../shared/domain";

export default function AvailabilityPanel({ catalog, change }: {
  catalog: Catalog;
  change: (change: AvailabilityChange) => void;
}) {
  const [productId, setProductId] = useState("");
  const products = catalog.products.filter((product) => !product.archived);
  const selected = products.find((product) => product.id === productId);
  const paused = catalog.liveAvailability?.buildersPaused ?? false;
  return (
    <div className="settings-grid">
      <section className="admin-card availability-panel">
        <h2>Disponibilidade no cardápio publicado</h2>
        <p className="muted">As mudanças entram no ar imediatamente. O rascunho fica salvo à parte.</p>
        <label className="field">Produto ou combo
          <select value={selected?.id ?? ""} onChange={(event) => setProductId(event.target.value)}>
            <option value="">Selecione um item…</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </label>
        {selected && (
          <>
            <label className="switch-row">
              <span>{selected.name} em estoque</span>
              <input type="checkbox" checked={productInStock(catalog, selected)} onChange={(event) =>
                change({ kind: "product", productId: selected.id, available: event.target.checked })} />
            </label>
            <fieldset className="hours-day">
              <legend>Opções e sabores em estoque</legend>
              {selected.variants.map((variant) => (
                <label className="switch-row" key={variant.id}>
                  <span>{variantLabel(selected, variant)}</span>
                  <input type="checkbox" checked={variantInStock(catalog, selected, variant.id)} onChange={(event) =>
                    change({ kind: "variant", productId: selected.id, variantId: variant.id, available: event.target.checked })} />
                </label>
              ))}
            </fieldset>
          </>
        )}
      </section>
      <section className="admin-card availability-panel">
        <h2>Montagens personalizadas</h2>
        <label className="switch-row">
          <span>Pausar montagens</span>
          <input type="checkbox" checked={paused} onChange={(event) => change({ kind: "builders", paused: event.target.checked })} />
        </label>
        <p className="muted">Os produtos prontos e os combos fixos mantêm a disponibilidade configurada.</p>
      </section>
    </div>
  );
}
