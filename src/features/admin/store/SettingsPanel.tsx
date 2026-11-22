import { type Catalog } from "../../../../shared/domain";

export default function SettingsPanel({
  catalog: c,
  change,
}: {
  catalog: Catalog;
  change: (c: Catalog) => void;
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
            ["hours", "Horários de atendimento"],
          ] as const
        ).map(([key, label]) => (
          <label className="field" key={key}>
            {label}
            <input
              maxLength={key === "name" ? 120 : 500}
              value={c[key]}
              onChange={(e) => change({ ...c, [key]: e.target.value })}
            />
          </label>
        ))}
      </section>
      <section className="admin-card">
        <h2>Contatos e destaque</h2>
        <label className="field">
          WhatsApp de pedidos
          <input
            value={c.whatsapp}
            inputMode="tel"
            placeholder="55 + DDD + número"
            maxLength={13}
            onChange={(e) =>
              change({ ...c, whatsapp: e.target.value.replace(/\D/g, "") })
            }
          />
          <small>Somente números. Exemplo de formato: 5511999999999.</small>
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

