<script lang="ts">
	import Button from '$lib/components/Button.svelte'
	import {
		initAuth,
		signIn,
		signOut,
		getAuthState,
	} from '$lib/google-auth.svelte'
	import {
		syncOnSignIn,
		scheduleSaveToDrive,
		getSyncState,
	} from '$lib/sync.svelte'
	import {
		noteIds,
		createNote,
		getNoteContent,
		setNoteContent,
		deleteNote,
		onNotesChange,
	} from '$lib/utils'
	import {
		SquarePenIcon,
		Trash2Icon,
		LogInIcon,
		LogOutIcon,
		CloudIcon,
		LoaderCircleIcon,
		CircleAlertIcon,
		CloudOffIcon,
		RefreshCwIcon,
	} from '@lucide/svelte'
	import { onMount } from 'svelte'
	import { useDebounce } from 'runed'
	import { useSearchParams } from 'runed/kit'
	import { fly } from 'svelte/transition'
	import * as v from 'valibot'

	const auth = getAuthState()
	const sync = getSyncState()

	const params = useSearchParams(
		v.object({
			note: v.optional(v.string(), ''),
		}),
		{ noScroll: true },
	)

	const updateNote = useDebounce(
		(content: string) => setNoteContent(params.note, content),
		() => 500,
	)

	onMount(() => {
		initAuth()
		onNotesChange(() => scheduleSaveToDrive())
	})

	$effect(() => {
		if (auth.isSignedIn) {
			syncOnSignIn()
		}
	})

	function formatTime(date: Date) {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	}
</script>

{#if auth.isLoading}
	<main class="flex h-dvh items-center justify-center">
		<LoaderCircleIcon size={24} class="animate-spin text-zinc-500" />
	</main>
{:else if !auth.isSignedIn}
	<main class="flex h-dvh flex-col items-center justify-center gap-6">
		<div class="flex flex-col items-center gap-2">
			<h1 class="font-mono text-2xl text-white">notes</h1>
			<p class="font-mono text-sm text-zinc-500">sign in to sync your notes with Google Drive</p>
		</div>
		<Button icon={LogInIcon} onclick={() => signIn()}>
			Sign in with Google
		</Button>
	</main>
{:else}
	<main class="grid h-dvh w-full grid-cols-[16rem_1fr]">
		<aside class="flex flex-col gap-2 overflow-y-scroll p-4">
			<div class="mb-4 flex flex-col gap-2">
				<Button
					icon={SquarePenIcon}
					onclick={() => {
						params.note = createNote()
					}}
				>
					Create Note
				</Button>

				<Button
					variant="secondary"
					icon={LogOutIcon}
					onclick={() => signOut()}
				>
					Sign Out
				</Button>

				<div class="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-400">
					{#if sync.status === 'syncing'}
						<LoaderCircleIcon size={14} class="shrink-0 animate-spin text-blue-400" />
						<span class="text-blue-400">Syncing...</span>
					{:else if sync.status === 'error'}
						<CircleAlertIcon size={14} class="shrink-0 text-red-400" />
						<div class="flex min-w-0 flex-col gap-0.5">
							<span class="text-red-400">Sync failed</span>
							<span class="truncate text-red-400/60" title={sync.error}>{sync.error}</span>
						</div>
						<button
							class="ml-auto shrink-0 cursor-pointer text-zinc-500 transition-colors hover:text-white"
							onclick={() => syncOnSignIn()}
							title="Retry sync"
						>
							<RefreshCwIcon size={12} />
						</button>
					{:else if sync.pendingSave}
						<CloudIcon size={14} class="shrink-0 text-yellow-400/60" />
						<span class="text-yellow-400/60">Unsaved changes</span>
					{:else if sync.lastSyncedAt}
						<CloudIcon size={14} class="shrink-0 text-green-400" />
						<span>
							{sync.notesSynced} {sync.notesSynced === 1 ? 'note' : 'notes'} synced
							<span class="text-zinc-500">{formatTime(sync.lastSyncedAt)}</span>
						</span>
					{:else}
						<CloudOffIcon size={14} class="shrink-0" />
						<span>Not yet synced</span>
					{/if}
				</div>
			</div>

			<div class="flex flex-col-reverse gap-4">
				{#each noteIds.current as noteId (noteId)}
					{@render noteButton(noteId)}
				{/each}
			</div>
		</aside>

		{#key params.note}
			{@const noteContent = getNoteContent(params.note)}

			<div in:fly={{ y: 10 }} class="mt-8 flex justify-center overflow-scroll">
				<textarea
					value={noteContent.current}
					class="mx-auto field-sizing-content min-h-full w-full max-w-[700px] resize-none rounded-t-lg bg-zinc-700 px-8 pt-8 pb-64 font-mono wrap-break-word text-white outline-none"
					oninput={(e) => updateNote(e.currentTarget.value)}
				></textarea>
			</div>
		{/key}
	</main>
{/if}

{#snippet noteButton(id: string)}
	<div class="group flex w-full items-center gap-3">
		<Button
			size="icon"
			class="hidden shrink-0 group-hover:flex"
			icon={Trash2Icon}
			onclick={() => {
				if (confirm(`are you sure you want to delete note '${id}'`)) {
					deleteNote(id)
				}
			}}
		/>
		<Button
			title={id}
			variant={params.note === id ? 'primary' : 'secondary'}
			class="grow justify-start gap-0 truncate"
			onclick={() => {
				updateNote.runScheduledNow()
				params.note = id
			}}
		>
			{#if updateNote.pending && params.note === id}
				<div class="mr-2 size-2 rounded-full bg-zinc-900"></div>
			{/if}

			{#key updateNote.pending}
				{@const content = getNoteContent(id)}

				{#if content.current}
					<span class="truncate">
						{content.current}
					</span>
				{:else}
					<span class="truncate opacity-40">Empty note ({id})</span>
				{/if}
			{/key}
		</Button>
	</div>
{/snippet}
