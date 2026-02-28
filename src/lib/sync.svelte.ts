import { getValidToken, getAuthState } from './google-auth.svelte'
import { loadNotes, saveNotes, type NotesData } from './google-drive'
import { noteIds } from './utils'

let status = $state<'idle' | 'syncing' | 'error'>('idle')
let error = $state('')
let lastSyncedAt = $state<Date | null>(null)
let notesSynced = $state(0)
let pendingSave = $state(false)

export function getSyncState() {
	return {
		get status() {
			return status
		},
		get error() {
			return error
		},
		get lastSyncedAt() {
			return lastSyncedAt
		},
		get notesSynced() {
			return notesSynced
		},
		get pendingSave() {
			return pendingSave
		},
	}
}

function getLocalData(): NotesData {
	const ids = noteIds.current
	const notes: Record<string, string> = {}
	for (const id of ids) {
		const raw = localStorage.getItem(id)
		if (raw) notes[id] = raw
	}
	return { ids, notes }
}

function applyRemoteData(remote: NotesData) {
	const localIds = new Set(noteIds.current)
	for (const id of remote.ids) {
		if (!localIds.has(id) && remote.notes[id]) {
			localStorage.setItem(id, remote.notes[id])
		}
	}
	const mergedIds = [...new Set([...noteIds.current, ...remote.ids])]
	noteIds.current = mergedIds
}

export async function syncOnSignIn(): Promise<void> {
	status = 'syncing'
	error = ''
	try {
		const token = await getValidToken()
		const remote = await loadNotes(token)
		if (remote) {
			applyRemoteData(remote)
		}
		await saveToDrive()
	} catch (e) {
		status = 'error'
		error = e instanceof Error ? e.message : 'Sync failed'
		console.error('Sync error:', e)
	}
}

export async function saveToDrive(): Promise<void> {
	const auth = getAuthState()
	if (!auth.isSignedIn) return

	status = 'syncing'
	error = ''
	pendingSave = false
	try {
		const token = await getValidToken()
		const data = getLocalData()
		await saveNotes(token, data)
		notesSynced = data.ids.length
		lastSyncedAt = new Date()
		status = 'idle'
	} catch (e) {
		status = 'error'
		error = e instanceof Error ? e.message : 'Save failed'
		console.error('Drive save error:', e)
	}
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null

export function scheduleSaveToDrive() {
	const auth = getAuthState()
	if (!auth.isSignedIn) return

	pendingSave = true
	if (saveTimeout) clearTimeout(saveTimeout)
	saveTimeout = setTimeout(() => saveToDrive(), 2000)
}
