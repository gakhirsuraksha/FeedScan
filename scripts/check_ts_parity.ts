import { readFileSync } from 'node:fs';
import { forestProba } from '../src/model/RandomForestModel';

const check = JSON.parse(readFileSync(new URL('../ml/ts_check.json', import.meta.url), 'utf-8'));
const { X, proba: pyProba } = check as { X: number[][]; proba: number[][] };

let maxDiff = 0;
X.forEach((row, i) => {
  const tsProba = forestProba(row);
  pyProba[i].forEach((p, c) => {
    maxDiff = Math.max(maxDiff, Math.abs(p - tsProba[c]));
  });
});

console.log(`Checked ${X.length} rows. Max |Python - TS| probability diff: ${maxDiff.toFixed(6)}`);
// Tree values are exported rounded to 4 decimals, so allow that much slack.
if (maxDiff > 1e-3) {
  console.error('MISMATCH — TS port does not match the trained model.');
  process.exit(1);
}
console.log('OK — TS forest matches the Python-trained model exactly.');
