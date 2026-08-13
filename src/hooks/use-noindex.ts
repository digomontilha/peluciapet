// src/hooks/use-noindex.ts
// Seta <meta name="robots" content="noindex, nofollow"> via DOM quando o componente monta.
// Util para paginas admin/auth que nao devem ser indexadas.
// Alternativa mais leve que injetar <Noindex /> em cada JSX.
import { useEffect } from 'react';

const ROBOTS_NAME = 'robots';
const NOINDEX_CONTENT = 'noindex, nofollow';

function setMetaRobots(content: string | null) {
  let el = document.head.querySelector(`meta[name="${ROBOTS_NAME}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', ROBOTS_NAME);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useNoindex() {
  useEffect(() => {
    const previous = document.head
      .querySelector(`meta[name="${ROBOTS_NAME}"]`)
      ?.getAttribute('content') ?? null;
    setMetaRobots(NOINDEX_CONTENT);
    return () => {
      // Restaura o estado anterior ao desmontar
      setMetaRobots(previous);
    };
  }, []);
}
