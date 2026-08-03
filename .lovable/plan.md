Add owner-only swim deletion

## What this plan does
Right now a user can log a swim but cannot remove it. This plan adds a minimal delete flow: a small "Delete" action on each swim card the current user owns, confirmed by a native-feeling alert dialog, backed by a database policy that lets owners delete only their own rows.

## Changes

### 1. Database access rule
- Add a `DELETE` policy on `public.swims` that allows deletion only when `auth.uid() = user_id`.
- The existing `ALL` owner policy already covers insert/update, so this only adds the missing delete path.

### 2. Data helper
- Add `deleteSwim(swimId: string)` in `src/lib/swims.ts` that calls `supabase.from("swims").delete().eq("id", swimId)` and returns the result so the UI can refresh the list.

### 3. Swim card UI
- In `src/routes/index.tsx`, pass the current user into `SwimCard`.
- When `swim.user_id === user.id`, show a subtle "Delete" button (text link, destructive color) next to the username.
- Clicking it opens the existing `AlertDialog` component to confirm before deleting.

### 4. Delete flow
- On confirm, call `deleteSwim`, then invalidate the `swimsQueryKey` query so the map and grid update immediately.
- Show a toast success or error message via `sonner`.
- Keep the UI minimal and consistent with the existing dark glacial design.

### 5. Optional cleanup
- If the deleted swim has a `photo_path`, also remove the matching object from the `swim-photos` storage bucket so we don't leave orphaned uploads. This happens after the row delete succeeds.

## Outcome
Signed-in users see a delete option only on their own swims, with a confirmation step, and both the database row and the stored photo are cleaned up.
