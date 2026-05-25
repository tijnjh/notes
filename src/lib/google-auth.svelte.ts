const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'
const STORAGE_KEY = 'google_auth'

type StoredAuth = {
	accessToken: string
	expiresAt: number
	hasGrantedAccess: boolean
}

let accessToken = $state('')
let tokenExpiresAt = $state(0)
let isSignedIn = $state(false)
let isLoading = $state(true)

let tokenClient: google.accounts.oauth2.TokenClient | null = null

function readStoredAuth(): StoredAuth | null {
	const raw = localStorage.getItem(STORAGE_KEY)
	if (!raw) return null
	if (raw === '1') {
		return {
			accessToken: '',
			expiresAt: 0,
			hasGrantedAccess: true,
		}
	}

	try {
		const parsed = JSON.parse(raw)
		if (
			typeof parsed?.accessToken === 'string' &&
			typeof parsed?.expiresAt === 'number' &&
			typeof parsed?.hasGrantedAccess === 'boolean'
		) {
			return parsed satisfies StoredAuth
		}
	} catch {
		// Ignore invalid persisted auth state and reset below.
	}

	localStorage.removeItem(STORAGE_KEY)
	return null
}

function writeStoredAuth(partial?: Partial<StoredAuth>) {
	const current = readStoredAuth() ?? {
		accessToken: '',
		expiresAt: 0,
		hasGrantedAccess: false,
	}

	localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify({
			...current,
			...partial,
		}),
	)
}

function clearStoredAuth() {
	localStorage.removeItem(STORAGE_KEY)
}

function loadGisScript(): Promise<void> {
	if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
		return Promise.resolve()
	}
	return new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.src = 'https://accounts.google.com/gsi/client'
		script.onload = () => resolve()
		script.onerror = () => reject(new Error('Failed to load GIS script'))
		document.head.appendChild(script)
	})
}

function handleTokenResponse(response: google.accounts.oauth2.TokenResponse) {
	if (response.error) {
		console.error('Auth error:', response.error_description)
		accessToken = ''
		tokenExpiresAt = 0
		isSignedIn = false
		clearStoredAuth()
		return false
	}
	accessToken = response.access_token
	tokenExpiresAt = Date.now() + response.expires_in * 1000
	isSignedIn = true
	writeStoredAuth({
		accessToken,
		expiresAt: tokenExpiresAt,
		hasGrantedAccess: true,
	})
	return true
}

export async function initAuth() {
	await loadGisScript()
	tokenClient = google.accounts.oauth2.initTokenClient({
		client_id: CLIENT_ID,
		scope: SCOPES,
		callback: (response) => {
			handleTokenResponse(response)
			isLoading = false
		},
		error_callback: (error) => {
			console.error('Auth error:', error.message)
			isLoading = false
		},
	})

	const storedAuth = readStoredAuth()
	if (storedAuth && Date.now() < storedAuth.expiresAt - 60_000) {
		accessToken = storedAuth.accessToken
		tokenExpiresAt = storedAuth.expiresAt
		isSignedIn = true
		isLoading = false
		return
	}

	if (storedAuth?.hasGrantedAccess) {
		tokenClient.requestAccessToken({ prompt: '' })
	} else {
		isLoading = false
	}
}

export function signIn() {
	tokenClient?.requestAccessToken({ prompt: 'consent' })
}

export function signOut() {
	if (accessToken) {
		google.accounts.oauth2.revoke(accessToken)
	}
	accessToken = ''
	tokenExpiresAt = 0
	isSignedIn = false
	clearStoredAuth()
}

export async function getValidToken(): Promise<string> {
	if (accessToken && Date.now() < tokenExpiresAt - 60_000) {
		return accessToken
	}
	return new Promise((resolve, reject) => {
		const client = google.accounts.oauth2.initTokenClient({
			client_id: CLIENT_ID,
			scope: SCOPES,
			callback: (response) => {
				if (handleTokenResponse(response)) {
					resolve(accessToken)
				} else {
					reject(new Error(response.error_description))
				}
			},
			error_callback: (error) => {
				reject(new Error(error.message))
			},
		})
		client.requestAccessToken({ prompt: '' })
	})
}

export function getAuthState() {
	return {
		get isSignedIn() {
			return isSignedIn
		},
		get isLoading() {
			return isLoading
		},
		get accessToken() {
			return accessToken
		},
	}
}
