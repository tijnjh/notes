<script lang="ts">
	import Button from '$lib/components/Button.svelte'
	import type { Note } from '$lib/types'
	import {
		noteIds,
		createNote,
		getNoteContent,
		setNoteContent,
		deleteNote,
	} from '$lib/utils'
	import { SquarePenIcon, Trash2Icon } from '@lucide/svelte'
	import { useDebounce } from 'runed'
	import { useSearchParams } from 'runed/kit'
	import { fly, scale, slide } from 'svelte/transition'
	import * as v from 'valibot'

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

	const notes = $derived.by(() => {
		const obj = []

		for (const noteId of noteIds.current) {
			obj.push({
				id: noteId,
				content: getNoteContent(noteId).current,
			})
		}

		return obj
	})
</script>

<main class="grid h-dvh w-full grid-cols-[16rem_1fr]">
	<aside class="flex flex-col gap-2 overflow-y-scroll p-4">
		<Button
			icon={SquarePenIcon}
			onclick={() => {
				params.note = createNote()
			}}
			class="mb-4"
		>
			Create Note
		</Button>

		<div class="flex flex-col-reverse gap-4">
			{#each notes as note (note.id)}
				{@render noteButton(note)}
			{/each}
		</div>
	</aside>

	{#key params.note}
		{@const noteContent = getNoteContent(params.note)}

		<div in:fly={{ y: 10 }} class="mt-8 flex justify-center overflow-scroll">
			<textarea
				value={noteContent.current}
				class="mx-auto field-sizing-content min-h-full w-full max-w-[700px] resize-none rounded-lg bg-zinc-700 px-8 pt-8 pb-64 font-mono wrap-break-word text-white outline-none"
				oninput={(e) => updateNote(e.currentTarget.value)}
			></textarea>
		</div>
	{/key}
</main>

{#snippet noteButton(note: Note)}
	<div class="group flex w-full items-center gap-3">
		<Button
			size="icon"
			class="hidden shrink-0 group-hover:flex"
			icon={Trash2Icon}
			onclick={() => {
				if (confirm(`are you sure you want to delete note '${note.id}'`)) {
					deleteNote(note.id)
				}
			}}
		/>
		<Button
			variant={params.note === note.id ? 'primary' : 'secondary'}
			class="grow justify-start gap-0 truncate"
			onclick={() => {
				updateNote.runScheduledNow()
				params.note = note.id
			}}
		>
			{#if updateNote.pending && params.note === note.id}
				<div transition:scale={{ opacity: 0 }}>
					<div
						transition:slide={{ axis: 'x' }}
						class="mr-2 size-2 rounded-full bg-zinc-900"
					></div>
				</div>
			{/if}
			<span class="truncate">{note.content?.trim() || note.id}</span>
		</Button>
	</div>
{/snippet}
