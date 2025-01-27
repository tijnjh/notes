<script lang="ts">
    import { PlusIcon, DownloadIcon } from "lucide-svelte";
    import Tab from "./lib/components/Tab.svelte";
    import Editor from "./lib/components/Editor.svelte";
    import { generateId } from "./lib/utils";
    import "./app.css";
    import { fly } from "svelte/transition";

    type Note = {
        id: string;
        title: string;
        content: string;
    };

    let notes: Note[] = $state([]);
    let activeNoteId: string = $state("");

    const activeNote = $derived(notes.find((note) => note.id === activeNoteId));

    const savedNotes = localStorage.getItem("notes");
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
        if (notes.length > 0) {
            activeNoteId = notes[0].id;
        }
    }

    $effect(() => {
        localStorage.setItem("notes", JSON.stringify(notes));
    });

    function createNote() {
        const newNote: Note = {
            id: generateId(),
            title: `Note ${notes.length + 1}`,
            content: "",
        };
        notes = [...notes, newNote];
        activeNoteId = newNote.id;
    }

    function deleteNote(id: string) {
        notes = notes.filter((note) => note.id !== id);
        if (activeNoteId === id && notes.length > 0) {
            activeNoteId = notes[0].id;
        } else if (notes.length === 0) {
            activeNoteId = "";
        }
    }

    function updateNoteContent(id: string, content: string) {
        notes = notes.map((note) =>
            note.id === id ? { ...note, content } : note,
        );
    }

    function updateNoteTitle(id: string, title: string) {
        notes = notes.map((note) =>
            note.id === id ? { ...note, title } : note,
        );
    }

    function exportNote(note: Note) {
        const blob = new Blob([note.content], {
            type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${note.title}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    window.onkeydown = (e) => {
        if (e.metaKey && e.key === "s") {
            e.preventDefault();
            if (activeNote) {
                exportNote(activeNote);
            }
        }
    };
</script>

<main
    class="h-svh grid grid-rows-[min-content_min-content_1fr] w-full bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"
>
    <header
        class="p-4 w-full grid gap-4 bg-white dark:bg-black items-center grid-cols-[1fr_max-content]"
    >
        <h1 class="text-xl font-semibold">Notes</h1>
        <div class="flex gap-2 items-center">
            {#if activeNote}
                <button
                    onclick={() => exportNote(activeNote)}
                    class="btn bg-zinc-100 dark:bg-zinc-900"
                >
                    <DownloadIcon class="size-4" />
                    Download
                </button>
            {/if}
            <button onclick={createNote} class="btn bg-amber-500 text-zinc-100">
                <PlusIcon class="size-4" />
                New
            </button>
        </div>
    </header>

    <div class="flex items-start gap-2 p-2 overflow-x-scroll">
        {#each notes as note}
            <Tab
                {note}
                isActive={note.id === activeNoteId}
                onSelect={() => (activeNoteId = note.id)}
                onDelete={deleteNote}
            />
        {:else}
            <div class="px-3 py-2 font-mono">No notes</div>
        {/each}
    </div>

    {#key activeNoteId}
        <div in:fly={{ y: 10 }} class="flex justify-center overflow-scroll">
            {#if activeNote}
                <Editor
                    content={activeNote.content}
                    onContentChange={(content) =>
                        updateNoteContent(activeNote.id, content)}
                />
            {:else}
                <div
                    class="flex-1 flex items-center justify-center text-muted-foreground"
                >
                    Create a new note to get started
                </div>
            {/if}
        </div>
    {/key}
</main>
