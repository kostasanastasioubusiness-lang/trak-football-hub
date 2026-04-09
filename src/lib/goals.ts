import { supabase } from '@/integrations/supabase/client'
import type { Goal, Match } from './types'

export async function checkAutoGoals(playerId: string, _match: Match): Promise<Goal[]> {
  const { data: goals } = await supabase
    .from('player_goals')
    .select('*')
    .eq('user_id', playerId)

  if (!goals || goals.length === 0) return []
  // For the existing schema, player_goals has goal_type and target_value
  // Adapt as needed - return empty for now since schema doesn't support auto-tracking yet
  return []
}
