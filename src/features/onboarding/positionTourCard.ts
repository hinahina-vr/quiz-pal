/**
 * 操作ガイドを、説明対象のボタンや入力欄の近くへ配置します。
 * 画面内に収まる上下左右の位置を探し、狭い画面ではカードの大きさも調整します。
 */
// Geometry shared with the standalone quiz tour; verified together in browser regression tests.
export function positionTourCard(card: HTMLElement, rect: DOMRect | null) {

  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;
  const inset = 10, gap = 16;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, Math.max(min, max)));
  card.style.width = Math.min(480, vw - inset * 2) + "px";
  card.style.maxHeight = (vh - inset * 2) + "px";
  card.style.right = "auto";
  card.style.bottom = "auto";
  const r = rect ? {left: clamp(rect.left, inset, vw-inset), right: clamp(rect.right, inset, vw-inset), top: clamp(rect.top, inset, vh-inset), bottom: clamp(rect.bottom, inset, vh-inset)} : null;
  let measured = card.getBoundingClientRect();
  if (r && r.left - inset < measured.width + gap && vw - inset - r.right < measured.width + gap) {
    const verticalSpace = Math.max(r.top - inset - gap, vh - inset - r.bottom - gap);
    if (verticalSpace >= 160 && verticalSpace < measured.height) {
      card.style.maxHeight = verticalSpace + "px";
      measured = card.getBoundingClientRect();
    }
  }
  const w = measured.width, h = measured.height;
  let left = (vw-w)/2, top = (vh-h)/2;
  if (r) {
    const cx = (r.left+r.right)/2, cy = (r.top+r.bottom)/2;
    const candidates = [[r.right+gap,cy-h/2], [cx-w/2,r.bottom+gap], [r.left-gap-w,cy-h/2], [cx-w/2,r.top-gap-h]];
    const ranked = candidates.map(([x,y]) => {
      const l=clamp(x,inset,vw-w-inset), t=clamp(y,inset,vh-h-inset);
      const overlap=Math.max(0,Math.min(l+w,r.right+7)-Math.max(l,r.left-7))*Math.max(0,Math.min(t+h,r.bottom+7)-Math.max(t,r.top-7));
      return {left:l,top:t,score:overlap*1000+Math.abs(l-x)+Math.abs(t-y)};
    }).sort((a,b)=>a.score-b.score);
    ({left,top}=ranked[0]);
  }
  card.style.left = clamp(left,inset,vw-w-inset) + "px";
  card.style.top = clamp(top,inset,vh-h-inset) + "px";
}
