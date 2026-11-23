import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import type { Catalog, Highlight, Product } from "../../../shared/domain";
import { FeaturedProduct } from "./ProductViews";

type Slide =
  | { kind: "product"; key: string; product: Product }
  | { kind: "notice"; key: string; notice: Highlight };

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function NoticeSlide({ notice }: { notice: Highlight }) {
  const description = [notice.title, notice.text].map((part) => part.trim()).filter(Boolean).join(". ");
  if (notice.image) {
    return (
      <article className="highlight-notice has-image">
        <img src={notice.image} alt={description} width={1200} height={600} loading="lazy" decoding="async" />
      </article>
    );
  }
  return (
    <article className="highlight-notice">
      <Megaphone size={26} aria-hidden="true" />
      <div>
        <h2>{notice.title}</h2>
        {notice.text && <p>{notice.text}</p>}
      </div>
    </article>
  );
}

// Vitrine em carrossel: produtos em destaque primeiro, depois os avisos da Laís.
// Sem rotação automática: quem usa decide quando passar (acessibilidade e leitura calma).
export function HighlightCarousel({
  products,
  notices,
  catalog,
  onSelect,
}: {
  products: Product[];
  notices: Highlight[];
  catalog: Catalog;
  onSelect: (product: Product, opener: HTMLButtonElement) => void;
}) {
  const slides: Slide[] = [
    ...products.map((product) => ({ kind: "product" as const, key: `p-${product.id}`, product })),
    ...notices.map((notice) => ({ kind: "notice" as const, key: `n-${notice.id}`, notice })),
  ];
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const frame = useRef(0);
  const count = slides.length;

  useEffect(() => {
    if (index > count - 1) setIndex(Math.max(0, count - 1));
  }, [count, index]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  if (!count) return null;
  const render = (slide: Slide) =>
    slide.kind === "product"
      ? <FeaturedProduct product={slide.product} catalog={catalog} onSelect={onSelect} />
      : <NoticeSlide notice={slide.notice} />;
  if (count === 1) return <div className="highlight-single">{render(slides[0])}</div>;

  function onScroll() {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = track.current;
      if (!el) return;
      let nearest = 0;
      let distance = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const gap = Math.abs((child as HTMLElement).offsetLeft - el.scrollLeft);
        if (gap < distance) { distance = gap; nearest = i; }
      });
      setIndex(nearest);
    });
  }
  function go(target: number) {
    const el = track.current;
    const child = el?.children[target] as HTMLElement | undefined;
    if (!el || !child) return;
    el.scrollTo({ left: child.offsetLeft, behavior: reducedMotion() ? "auto" : "smooth" });
    setIndex(target);
  }

  return (
    <section className="highlight-carousel" aria-roledescription="carrossel" aria-label="Destaques da loja">
      <div className="highlight-track" ref={track} onScroll={onScroll} tabIndex={0}>
        {slides.map((slide, i) => (
          <div
            className="highlight-slide"
            key={slide.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${count}`}
          >
            {render(slide)}
          </div>
        ))}
      </div>
      <div className="highlight-controls">
        <button type="button" className="highlight-arrow" aria-label="Destaque anterior" disabled={index === 0} onClick={() => go(index - 1)}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <div className="highlight-dots">
          {slides.map((slide, i) => (
            <button
              type="button"
              key={slide.key}
              className={i === index ? "active" : ""}
              aria-label={`Ir para o destaque ${i + 1} de ${count}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <button type="button" className="highlight-arrow" aria-label="Próximo destaque" disabled={index === count - 1} onClick={() => go(index + 1)}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
