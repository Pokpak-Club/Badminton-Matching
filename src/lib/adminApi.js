import { supabase } from './supabase'

function getToken() {
  return localStorage.getItem('smash_league_token')
}

async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, { p_token: getToken(), ...params })
  if (error) throw new Error(error.message)
  return data
}

export const adminApi = {
  scheduleMatch: (player1_id, player2_id, round_label) =>
    rpc('schedule_match', { p_player1_id: player1_id, p_player2_id: player2_id, p_round_label: round_label }),

  cancelScheduledMatch: (id) =>
    rpc('cancel_scheduled_match', { p_id: id }),

  recordMatch: ({ player1_id, player2_id, winner_id, game_scores, scheduled_match_id }) =>
    rpc('record_match', {
      p_player1_id: player1_id,
      p_player2_id: player2_id,
      p_winner_id: winner_id,
      p_game_scores: game_scores,
      p_scheduled_match_id: scheduled_match_id || null,
    }),

  overrideRating: (player_id, new_rating, reason) =>
    rpc('override_rating', { p_player_id: player_id, p_new_rating: new_rating, p_reason: reason }),

  updateSettings: (k_factor, starting_rating) =>
    rpc('update_settings', { p_k_factor: k_factor, p_starting_rating: starting_rating }),

  setRole: (player_id, role) =>
    rpc('set_role', { p_player_id: player_id, p_role: role }),

  deletePlayer: (player_id) =>
    rpc('delete_player', { p_player_id: player_id }),
}
