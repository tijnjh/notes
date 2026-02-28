const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
const FILE_NAME = 'notes.json'

export interface NotesData {
	ids: string[]
	notes: Record<string, string>
}

async function findNotesFile(token: string): Promise<string | null> {
	const params = new URLSearchParams({
		q: `name='${FILE_NAME}'`,
		spaces: 'appDataFolder',
		fields: 'files(id)',
	})
	const res = await fetch(`${DRIVE_API}/files?${params}`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) throw new Error(`Drive search failed: ${res.status}`)
	const data = await res.json()
	return data.files?.[0]?.id ?? null
}

export async function loadNotes(token: string): Promise<NotesData | null> {
	const fileId = await findNotesFile(token)
	if (!fileId) return null
	const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) throw new Error(`Drive download failed: ${res.status}`)
	return res.json()
}

export async function saveNotes(token: string, data: NotesData): Promise<void> {
	const fileId = await findNotesFile(token)
	const metadata = {
		name: FILE_NAME,
		...(fileId ? {} : { parents: ['appDataFolder'] }),
	}
	const body = new FormData()
	body.append(
		'metadata',
		new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
	)
	body.append(
		'file',
		new Blob([JSON.stringify(data)], { type: 'application/json' }),
	)

	const url = fileId
		? `${UPLOAD_API}/files/${fileId}?uploadType=multipart`
		: `${UPLOAD_API}/files?uploadType=multipart`

	const res = await fetch(url, {
		method: fileId ? 'PATCH' : 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body,
	})
	if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`)
}
