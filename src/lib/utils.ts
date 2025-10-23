import * as lzString from 'lz-string'
import { PersistedState } from 'runed'

const serializer = {
	serialize: (value: string | null) => {
		if (!value) return ''
		return lzString.compressToEncodedURIComponent(value)
	},
	deserialize: (value: string | null) => {
		if (!value) return
		return lzString.decompressFromEncodedURIComponent(value)
	},
}

export const noteIds = new PersistedState<string[]>('ids', [])

export function createNote() {
	const id = Math.random().toString(36).substring(2)
	new PersistedState<string | null>(id, '', { serializer })
	noteIds.current.push(id)
	return id
}

export function setNoteContent(id: string, content: string) {
	const noteContent = getNoteContent(id)
	noteContent.current = content
}

export function getNoteContent(id: string) {
	return new PersistedState<string | null>(id, null, { serializer })
}

export function deleteNote(id: string) {
	noteIds.current = noteIds.current.filter((noteId) => noteId !== id)
	localStorage.removeItem(id)
}
