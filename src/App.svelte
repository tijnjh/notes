<script lang="ts">
  import { DownloadIcon, PlusIcon, Variable } from "@lucide/svelte";
  import Tab from "./lib/components/Tab.svelte";
  import Editor from "./lib/components/Editor.svelte";
  import { generateId } from "./lib/utils";
  import "./app.css";
  import { fly } from "svelte/transition";
  import type { Note } from "./lib/types";
  import { Button } from "$lib/components/ui/button";

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
    notes = notes.map((note) => (note.id === id ? { ...note, content } : note));
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

  onkeydown = (e) => {
    if (e.metaKey && e.key === "s") {
      e.preventDefault();
      if (activeNote) {
        exportNote(activeNote);
      }
    }
  };
</script>

<main
  class="grid grid-rows-[min-content_min-content_1fr] bg-zinc-100 dark:bg-zinc-900 w-full h-svh text-black dark:text-white"
>
  <header
    class="items-center gap-4 grid grid-cols-[1fr_max-content] bg-white dark:bg-black p-4 w-full"
  >
    <h1 class="font-semibold text-xl">Notes</h1>
    <div class="flex items-center gap-2">
      {#if activeNote}
        <Button onclick={() => exportNote(activeNote)} variant="outline">
          <DownloadIcon class="size-4" />
          Download
        </Button>
      {/if}
      <Button onclick={createNote}>
        <PlusIcon class="size-4" />
        New
      </Button>
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
      <div class="last:hidden bg-border w-px h-full"></div>
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
          class="flex flex-1 justify-center items-center text-muted-foreground"
        >
          Create a new note to get started
        </div>
      {/if}
    </div>
  {/key}
</main>
