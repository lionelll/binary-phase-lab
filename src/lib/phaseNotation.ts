export interface PhaseNotationToken {
  text: string;
  subscript: boolean;
}

/**
 * 把一次、二次、三次相标记拆成可渲染的下角标片段。
 * 数据层继续保留易检索的 Fe₃CⅡ / αⅡ 文本，具体排版由视图层完成。
 */
export function tokenizePhaseNotation(text: string): PhaseNotationToken[] {
  return text
    .split(/([ⅠⅡⅢ]+)/u)
    .filter(Boolean)
    .map((part) => ({ text: part, subscript: /^[ⅠⅡⅢ]+$/u.test(part) }));
}
