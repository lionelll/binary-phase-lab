import { describe, expect, it } from 'vitest';
import { tokenizePhaseNotation } from './phaseNotation';

describe('phase notation', () => {
  it('把二次相罗马数字拆为下角标片段', () => {
    expect(tokenizePhaseNotation('αⅡ + βⅡ')).toEqual([
      { text: 'α', subscript: false },
      { text: 'Ⅱ', subscript: true },
      { text: ' + β', subscript: false },
      { text: 'Ⅱ', subscript: true },
    ]);
  });

  it('统一识别渗碳体的一次、二次和三次标记', () => {
    expect(tokenizePhaseNotation('Fe₃CⅠ / Fe₃CⅡ / Fe₃CⅢ').filter((token) => token.subscript).map((token) => token.text))
      .toEqual(['Ⅰ', 'Ⅱ', 'Ⅲ']);
  });
});
