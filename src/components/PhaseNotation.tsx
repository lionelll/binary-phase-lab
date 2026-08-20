import { Fragment } from 'react';
import { tokenizePhaseNotation } from '../lib/phaseNotation';

export function PhaseNotation({ text }: { text: string }) {
  return <>{tokenizePhaseNotation(text).map((token, index) => token.subscript
    ? <sub className="phase-index" key={`${token.text}-${index}`}>{token.text}</sub>
    : <Fragment key={`${token.text}-${index}`}>{token.text}</Fragment>)}</>;
}

export function SvgPhaseNotation({ text }: { text: string }) {
  return <>{tokenizePhaseNotation(text).map((token, index) => token.subscript
    ? <tspan className="svg-phase-index" baselineShift="sub" key={`${token.text}-${index}`}>{token.text}</tspan>
    : <tspan key={`${token.text}-${index}`}>{token.text}</tspan>)}</>;
}
