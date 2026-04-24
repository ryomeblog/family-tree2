import { useEffect, useState } from "react";

// インラインスタイルの多い本アプリでは CSS @media を併用しにくいため、
// メディアクエリの真偽値をフックで取り出して JSX 側で分岐する。
export function useMediaQuery(query: string): boolean {
  const get = () =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches;
  const [matches, setMatches] = useState<boolean>(get);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

// 標準の「スマホ幅」しきい値。PWA として手に取ったときの典型的な viewport を想定。
export const useIsMobile = () => useMediaQuery("(max-width: 720px)");
