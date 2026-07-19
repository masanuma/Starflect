import { useUI } from '../lib/ui'

/** ホーム下部のFAQ。SEO/AIO(AI回答エンジンへの引用)向けに、質問と回答をテキストで置く。 */
export default function Faq() {
  const t = useUI()
  return (
    <section className="faq" aria-label={t.faq.title}>
      <h2 className="faq-title">{t.faq.title}</h2>
      <ul className="faq-list">
        {t.faq.items.map((item, i) => (
          <li key={i} className="faq-item">
            <details>
              <summary className="faq-q">{item.q}</summary>
              <p className="faq-a">{item.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}
