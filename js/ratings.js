/* ---------- FPL-style card rating calculation ---------- */
import { RATING_BASE, DEFENDING_BASE, POSITION_WEIGHTS, DEFAULT_WEIGHTS } from './constants.js';

export function attackTier(avgPerMatch){
  if(avgPerMatch >= 5) return { key: 't5', min: 95, max: 99 };
  if(avgPerMatch >= 3) return { key: 't3', min: 90, max: 94 };
  if(avgPerMatch >= 2) return { key: 't2', min: 80, max: 89 };
  if(avgPerMatch >= 1) return { key: 't1', min: 70, max: 79 };
  return { key: 't0', min: RATING_BASE, max: RATING_BASE };
}

export function defendTier(avgDefPoints){
  const base = DEFENDING_BASE;
  if(avgDefPoints >= 4) return { key: 'd4', min: 95, max: 99 };
  if(avgDefPoints >= 3) return { key: 'd3', min: 90, max: 94 };
  if(avgDefPoints >= 2) return { key: 'd2', min: 85, max: 89 };
  if(avgDefPoints >= 1) return { key: 'd1', min: 80, max: 84 };
  return { key: 'd0', min: base, max: base };
}

function rollInRange(min, max){
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function ensurePlayerRatings(player, statRow, force = false){
  if(!player.ratings) player.ratings = {};
  let dirty = false;
  const matches = statRow ? statRow.matches : 0;
  const avgGoals = matches ? statRow.goals / matches : 0;
  const avgAssists = matches ? statRow.assists / matches : 0;
  const avgDefPoints = matches ? (statRow.defPoints || 0) / matches : 0;

  const tiers = {
    finishing: attackTier(avgGoals),
    passing: attackTier(avgAssists),
    defending: defendTier(avgDefPoints)
  };

  Object.keys(tiers).forEach(cat => {
    const tier = tiers[cat];
    const existing = player.ratings[cat];
    if(force || !existing || existing.tierKey !== tier.key){
      player.ratings[cat] = { tierKey: tier.key, value: rollInRange(tier.min, tier.max) };
      dirty = true;
    }
  });
  return dirty;
}

export function getPlayerRatingValues(player){
  const r = player.ratings || {};
  return {
    finishing: r.finishing ? r.finishing.value : RATING_BASE,
    passing: r.passing ? r.passing.value : RATING_BASE,
    defending: r.defending ? r.defending.value : DEFENDING_BASE
  };
}

export function computeOverall(player){
  const vals = getPlayerRatingValues(player);
  // Simple average of FIN, PAS, DEF for all positions
  return Math.round((vals.finishing + vals.passing + vals.defending) / 3);
}