# ML model: training and status

## What it is
A Random Forest classifier (30 trees, max depth 6) that labels a sample GOOD, CHECK or ACTION_REQUIRED.
It runs entirely in the browser (`src/model/RandomForestModel.ts`), so the app works offline.

## Inputs (19 features)
AS7341 channels F1-F8, Clear, NIR; moisture; temperature; pH (silage, else 0); sample type;
blue/green ratio; NIR/Clear ratio; **has_image flag; photo brightness; photo redness ratio**.

Photo is optional in the app. When no photo is taken, brightness/redness use neutral
defaults (128, 1.0) and has_image=0 — the training data includes both cases (70% with a
simulated photo, 30% without) so the model doesn't depend on a photo being present.
Photo colour is also still used directly by the rule-based `MockModel` guardrail (dark or
reddish images subtract score independently of what the forest predicts).

## Training data: SYNTHETIC
`ml/train_model.py` generates samples from expected sensor patterns for seven profiles
(five from the app simulator plus two training-only profiles so every class exists for feed and silage).
Training noise is +/-10%; the held-out test set uses an independent seed and +/-18% noise.
Photo colour per profile is also hand-set (e.g. dark + reddish-brown for mould/heat damage
profiles) — NOT measured from real photos — with the same noise applied.

Held-out result on synthetic data: **95.3%** accuracy (see `ml/metrics.json` for the confusion matrix).
This figure describes synthetic data only. It says nothing about accuracy on real feed, and it is
not comparable to the pre-camera model's 93.3% — more input features make synthetic data easier
to fit, which is exactly why this number still cannot be used as a real accuracy claim.

## How it is used in the app
1. The forest classifies the sensor reading.
2. The rule-based `MockModel` supplies the plain-language reasons and estimated values, and acts as a
   guardrail: the final class is never less severe than the rules' class.
3. `confidence` is the fraction of trees voting for the class, not an accuracy measure.

Estimated moisture/protein/fiber values are still rule-based approximations, not model outputs.

## Retraining on real data (next phase)
1. Collect real AS7341 + moisture/pH/temperature readings from many samples, with laboratory reference values.
2. Split train/test by sample or batch (never by individual reading).
3. Replace the synthetic generator in `ml/train_model.py` with a loader for the real dataset; add regression
   models for protein/fibre/moisture against lab values.
4. Run `python ml/train_model.py` (needs numpy, scikit-learn) and rebuild the app.

## Verifying the TypeScript port
`ml/train_model.py` also writes `ml/ts_check.json` (sample feature rows + the Python model's
predicted probabilities). `scripts/check_ts_parity.ts` re-runs those same rows through the
TypeScript forest (`forestProba` in `src/model/RandomForestModel.ts`) and asserts they match,
so a bug in the hand-written TS port doesn't silently diverge from the trained model. Run it
after every retrain: `npx tsx scripts/check_ts_parity.ts`.

## Known limitations
- Never validated on real samples.
- Broadband NIR (one AS7341 channel near 910 nm) is a weak signal compared with lab NIR instruments.
- Readings depend on a closed, fixed-illumination sensor chamber.
- Adulteration output is a screening flag, not identification of a substance.
