import { supabase } from '@/integrations/supabase/client'

export async function trackEvent(eventType: string, metadata: Record<string, unknown> = {}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // Telemetry table may not exist yet in the current schema
    // Silently try to insert - if table doesn't exist, the error is swallowed
    await supabase.from('telemetry_events' as any).insert({
      user_id: user.id,
      event_type: eventType,
      metadata,
    })
  } catch {
    // Telemetry must never block the user's flow
  }
}
