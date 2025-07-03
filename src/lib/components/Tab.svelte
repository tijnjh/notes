<script lang="ts">
  import { XIcon } from "@lucide/svelte";
  import type { Note } from "../types";

  let {
    note,
    isActive = false,
    onSelect,
    onDelete,
  }: {
    note: Note;
    isActive: boolean;
    onSelect: () => void;
    onDelete: (id: string) => void;
  } = $props();

  // Get preview text from content
  const preview = $derived(() => {
    const text = note.content.trim();
    return text ? text.slice(0, 20) : "New note";
  });
</script>

<div
  class={[
    "group relative flex items-center shrink-0 gap-2  rounded-md w-48",
    isActive
      ? "bg-white dark:bg-zinc-800"
      : "hover:bg-zinc-200 dark:hover:bg-zinc-950",
  ]}
>
  <button onclick={onSelect} class="px-3 py-2 text-left cursor-pointer grow">
    <span class="flex-1 font-mono truncate">
      {preview()}
    </span>
  </button>

  <button
    onclick={(e) => {
      e.stopPropagation();
      onDelete(note.id);
    }}
    class="bg-white/10 hover:bg-red-500/10 mr-2 p-1 rounded-sm hover:text-red-500 cursor-pointer shrink-0"
  >
    <XIcon class="size-4" />
  </button>
</div>
