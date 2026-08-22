import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Autosaves in-progress form data to public.form_drafts (database, not the
// browser) so a shutdown machine or a closed tab doesn't cost a re-entry, and
// a draft started on one device can be picked up on another. A draft never
// touches the real table by itself -- it only feeds fields back on reopen.
// The caller must call clearDraft() once the real save succeeds, or the
// same draft would keep coming back after the record it describes is done.
export function useFormDraft(pageKey: string, recordKey: string, enabled: boolean) {
  const [draft, setDraft] = useState<{ data: any; updatedAt: string } | null>(null)
  const [checked, setChecked] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setChecked(false)
    setDraft(null)
    if (!enabled || !recordKey) { setChecked(true); return }
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth?.user?.id ?? null
      userIdRef.current = uid
      if (!uid) { if (!cancelled) setChecked(true); return }
      const { data } = await supabase.from('form_drafts').select('form_data,updated_at')
        .eq('user_id', uid).eq('page_key', pageKey).eq('record_key', recordKey).maybeSingle()
      if (!cancelled) {
        if (data) setDraft({ data: data.form_data, updatedAt: data.updated_at })
        setChecked(true)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey, recordKey, enabled])

  // Debounced autosave -- one write a few seconds after typing stops, not one
  // per keystroke, so a long editing session doesn't hammer the database.
  const saveDraft = useCallback((formData: any) => {
    if (!enabled || !recordKey) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const uid = userIdRef.current ?? (await supabase.auth.getUser()).data?.user?.id
      if (!uid) return
      userIdRef.current = uid
      await supabase.from('form_drafts').upsert({
        user_id: uid, page_key: pageKey, record_key: recordKey,
        form_data: formData, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,page_key,record_key' })
    }, 2500)
  }, [pageKey, recordKey, enabled])

  const clearDraft = useCallback(async (key?: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    const uid = userIdRef.current ?? (await supabase.auth.getUser()).data?.user?.id
    if (!uid) return
    await supabase.from('form_drafts').delete()
      .eq('user_id', uid).eq('page_key', pageKey).eq('record_key', key ?? recordKey)
    setDraft(null)
  }, [pageKey, recordKey])

  return { draft, draftChecked: checked, saveDraft, clearDraft }
}
