const express = require('express');
const { generateMapSuggestion, MODEL } = require('../services/suggestionsAI');

const router = express.Router();

/**
 * POST /api/suggestions/map
 *   body: { username, seed? }
 *   200:  { text, source: 'gemini', model, meta }
 *   502:  { error }   (client falls back to its local picker)
 */
router.post('/map', async (req, res) => {
  const { username, seed } = req.body || {};
  if (!username) {
    return res.status(400).json({ error: 'username is required' });
  }

  try {
    const result = await generateMapSuggestion({
      username,
      seed: Number.isFinite(seed) ? seed : 0,
      now: new Date(),
    });
    res.json(result);
  } catch (err) {
    // The client falls back to its rules-based suggestion when this
    // endpoint fails, so a noisy log here is the only paper trail —
    // make it loud and include enough context to diagnose.
    console.error(
      `[suggestions/map] model=${MODEL} user=${username} seed=${seed} failed:`,
      err?.message || err
    );
    res.status(502).json({ error: err?.message || 'gemini call failed', model: MODEL });
  }
});

module.exports = router;
