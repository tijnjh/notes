<script lang="ts">
    import { TrashIcon } from "lucide-svelte";

    type Note = {
        id: string;
        title: string;
        content: string;
    };

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
    onclick={onSelect}
    class={[
        "group relative flex items-center shrink-0 gap-2 px-3 py-2 rounded-md cursor-pointer w-48",
        isActive
            ? "bg-white dark:bg-zinc-800"
            : "hover:bg-zinc-200 dark:hover:bg-zinc-950",
    ]}
>
    <span class="font-mono truncate flex-1">
        {preview()}
    </span>

    <button
        onclick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
        }}
        class="hidden cursor-pointer group-hover:block hover:text-red-500 hover:bg-red-500/10 bg-white/10 p-1 rounded-sm shrink-0"
    >
        <TrashIcon class="size-4" />
    </button>
</div>
