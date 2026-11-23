import { validPhone, type Catalog } from "../../../../shared/domain";
import { formatNational, nationalDigits, storedFromInput } from "../../../shared/phone";
import HoursEditor from "./HoursEditor";

export default function SettingsPanel({
  catalog: c,
  change,
  structuredHours,
  publishedWhatsapp,
}: {
  catalog: Catalog;
  change: (c: Catalog) => void;
  structuredHours: boolean;
  publishedWhatsapp?: string;
}) {
  return (
    <div className="settings-grid">
      <section className="admin-card">
        <h2>Informações da loja</h2>
        {(
          [
            ["name", "Nome da marca"],
            ["tagline", "Frase da marca"],
            ["location", "Localização"],
          ] as const
        ).map(([key, label]) => (
          <label className="field" key={key}>
            {label}
            <input
              maxLength={key === "name" ? 120 : key === "tagline" ? 40 : 500}
              value={c[key]}
              onChange={(e) => change({ ...c, [key]: e.target.value })}
            />
            {key === "tagline" && (
              <small className="muted">
                {c.tagline.length}/40 caracteres. Aparece numa linha só no topo do cardápio; o tamanho da letra se ajusta sozinho.
              </small>
            )}
          </label>
        ))}
        {!structuredHours && <label className="field">Horários de atendimento
          <input maxLength={250} value={c.hours} onChange={(event) => change({ ...c, hours: event.target.value })} />
        </label>}
      </section>
      {structuredHours && <HoursEditor hours={c.storeHours} change={(storeHours) => change({ ...c, storeHours })} />}
      <section className="admin-card">
        <h2>Contatos e destaque</h2>
        <label className="field">
          WhatsApp de pedidos
          <span className="phone-input">
            <span className="phone-prefix" aria-hidden="true">+55</span>
            <input
              value={formatNational(nationalDigits(c.whatsapp))}
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(81) 99999-9999"
              maxLength={16}
              aria-describedby="whatsapp-help"
              onChange={(e) => change({ ...c, whatsapp: storedFromInput(e.target.value) })}
            />
          </span>
          <small id="whatsapp-help">
            O +55 (Brasil) já é automático: digite só o DDD e o número.
            {c.whatsapp && !validPhone(c.whatsapp) && " Faltam dígitos: use DDD + 8 ou 9 dígitos."}
            {c.whatsapp && validPhone(c.whatsapp) && c.whatsapp !== publishedWhatsapp &&
              " Para o cardápio usar este número, clique em Publicar cardápio (salvar rascunho não basta)."}
          </small>
        </label>
        <label className="field">
          Usuário do Instagram
          <input
            value={c.instagram}
            placeholder="Sem @"
            maxLength={30}
            onChange={(e) =>
              change({
                ...c,
                instagram: e.target.value.replace(/[^a-z\d._]/gi, ""),
              })
            }
          />
          <small>
            Link de contato adicional. Os pedidos seguem pelo WhatsApp.
          </small>
        </label>
        <label className="switch-row">
          <span>Mostrar faixa de destaque</span>
          <input
            type="checkbox"
            checked={c.bannerEnabled}
            onChange={(e) => change({ ...c, bannerEnabled: e.target.checked })}
          />
        </label>
        <label className="field">
          Texto da faixa
          <textarea
            value={c.banner}
            maxLength={200}
            onChange={(e) => change({ ...c, banner: e.target.value })}
            rows={3}
          />
        </label>
      </section>
    </div>
  );
}

