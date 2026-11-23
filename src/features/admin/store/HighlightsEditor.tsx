import { useRef, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import { highlightImageLimits, highlightsError, maxHighlights, type Catalog, type Highlight } from "../../../../shared/domain";
import { Notice } from "../../../shared/ui";

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

function readImage(file: File): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      const url = String(reader.result);
      const image = new Image();
      image.onerror = () => reject(new Error("O arquivo não parece ser uma imagem válida."));
      image.onload = () => resolve({ url, width: image.naturalWidth, height: image.naturalHeight });
      image.src = url;
    };
    reader.readAsDataURL(file);
  });
}

// Confere formato, peso e proporção antes de aceitar. Mensagens dizem o que ajustar.
export async function checkHighlightImage(file: File) {
  const { types, maxBytes, width: goalWidth, height: goalHeight } = highlightImageLimits;
  if (!(types as readonly string[]).includes(file.type)) {
    throw new Error("Use uma imagem JPEG, PNG ou WebP.");
  }
  if (file.size > maxBytes) {
    throw new Error(`A imagem tem ${kb(file.size)}. O limite é ${kb(maxBytes)}. Exporte de novo com qualidade menor.`);
  }
  const image = await readImage(file);
  const ratio = image.width / image.height;
  if (Math.abs(ratio - goalWidth / goalHeight) > 0.06) {
    throw new Error(`A imagem tem ${image.width} × ${image.height} px. Use proporção 2:1, como ${goalWidth} × ${goalHeight} px.`);
  }
  if (image.width < 800 || image.width > 2400) {
    throw new Error(`Largura de ${image.width} px fora do ideal. Use entre 800 e 2400 px; o recomendado é ${goalWidth} px.`);
  }
  return image.url;
}

export default function HighlightsEditor({ catalog: c, change }: { catalog: Catalog; change: (c: Catalog) => void }) {
  const items = c.highlights ?? [];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const featured = c.products.filter((p) => p.featured && !p.archived);
  const problem = highlightsError(items);
  const set = (next: Highlight[]) => change({ ...c, highlights: next });
  const update = (id: string, patch: Partial<Highlight>) => set(items.map((item) => item.id === id ? { ...item, ...patch } : item));
  function move(index: number, delta: number) {
    const next = [...items];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    set(next);
  }
  async function upload(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const url = await checkHighlightImage(file);
      setErrors((old) => ({ ...old, [id]: "" }));
      update(id, { image: url });
    } catch (error) {
      setErrors((old) => ({ ...old, [id]: (error as Error).message }));
    }
  }
  return (
    <>
      <section className="admin-card">
        <div className="card-heading">
          <div>
            <h2>Avisos e promoções no topo do cardápio</h2>
            <p>
              Aparecem no carrossel da primeira tela, depois dos produtos em destaque. Use para feriado,
              mudança de horário ou promoção. Até {maxHighlights} avisos.
            </p>
          </div>
          <button
            type="button"
            className="button secondary compact"
            disabled={items.length >= maxHighlights}
            onClick={() => set([...items, { id: crypto.randomUUID(), title: "", text: "", active: true }])}
          >
            <Plus size={16} aria-hidden="true" /> Novo aviso
          </button>
        </div>
        <div className="highlight-guide" role="note">
          <strong>Como preparar a imagem</strong>
          <ul>
            <li>Tamanho: <b>1200 × 600 px</b> (proporção 2:1, mais larga que alta).</li>
            <li>Formato: <b>JPEG</b> (recomendado), PNG ou WebP.</li>
            <li>Peso: até <b>{kb(highlightImageLimits.maxBytes)}</b>. Qualidade 80% costuma bastar.</li>
            <li>Escreva o aviso dentro da imagem, com letras grandes e longe das bordas (o celular pode cortar um pouco).</li>
          </ul>
        </div>
        {featured.length > 0 && (
          <p className="muted small">
            Produtos em destaque que aparecem primeiro: {featured.slice(0, 5).map((p) => p.name).join(", ")}.
            Para mudar, edite um produto e marque ou desmarque "Em destaque".
          </p>
        )}
        {problem && <Notice error>{problem}</Notice>}
        {!items.length && <p className="muted">Nenhum aviso criado. Clique em "Novo aviso" para começar.</p>}
        {items.map((item, index) => (
          <fieldset className="highlight-editor" key={item.id}>
            <legend>Aviso {index + 1}</legend>
            <div className="highlight-editor-grid">
              <div>
                <label className="field">Título
                  <input maxLength={80} value={item.title} placeholder="Ex.: Sexta-feira, feriado"
                    onChange={(e) => update(item.id, { title: e.target.value })} />
                </label>
                <label className="field">Texto
                  <textarea rows={3} maxLength={240} value={item.text}
                    placeholder="Ex.: Não vamos funcionar. Voltamos na segunda, às 8h."
                    onChange={(e) => update(item.id, { text: e.target.value })} />
                  <small>{item.text.length}/240 · Com imagem, o texto serve de descrição para leitores de tela.</small>
                </label>
                <div className="highlight-dates">
                  <label className="field">Mostrar a partir de
                    <input type="date" value={item.from ?? ""} onChange={(e) => update(item.id, { from: e.target.value })} />
                  </label>
                  <label className="field">Mostrar até
                    <input type="date" value={item.until ?? ""} onChange={(e) => update(item.id, { until: e.target.value })} />
                  </label>
                </div>
              </div>
              <div className="highlight-image">
                {item.image ? (
                  <img src={item.image} alt="" />
                ) : (
                  <div className="highlight-image-empty">Sem imagem. O aviso aparece como cartão laranja com o texto.</div>
                )}
                <input
                  ref={(node) => { inputs.current[item.id] = node; }}
                  type="file"
                  hidden
                  accept={highlightImageLimits.types.join(",")}
                  onChange={(e) => void upload(item.id, e)}
                />
                <div className="highlight-image-actions">
                  <button type="button" className="button secondary compact" onClick={() => inputs.current[item.id]?.click()}>
                    <ImagePlus size={16} aria-hidden="true" /> {item.image ? "Trocar imagem" : "Enviar imagem"}
                  </button>
                  {item.image && (
                    <button type="button" className="text-button" onClick={() => update(item.id, { image: undefined })}>
                      Remover imagem
                    </button>
                  )}
                </div>
                {errors[item.id] && <Notice error>{errors[item.id]}</Notice>}
              </div>
            </div>
            <div className="highlight-editor-footer">
              <label className="switch-row">
                <input type="checkbox" checked={item.active} onChange={(e) => update(item.id, { active: e.target.checked })} />
                <span>Mostrar no cardápio</span>
              </label>
              <div>
                <button type="button" className="icon-button" aria-label={`Subir aviso ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp size={17} aria-hidden="true" />
                </button>
                <button type="button" className="icon-button" aria-label={`Descer aviso ${index + 1}`} disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDown size={17} aria-hidden="true" />
                </button>
                <button type="button" className="icon-button danger" aria-label={`Excluir aviso ${index + 1}`}
                  onClick={() => set(items.filter((x) => x.id !== item.id))}>
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            </div>
          </fieldset>
        ))}
      </section>
    </>
  );
}
