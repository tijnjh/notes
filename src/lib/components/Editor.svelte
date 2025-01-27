<script lang="ts">
    import { Tv } from "lucide-svelte";

    let {
        content = "",
        onContentChange,
    }: {
        content: string;
        onContentChange: (content: string) => void;
    } = $props();
</script>

<textarea
    value={content}
    oninput={(e) => onContentChange(e.currentTarget.value)}
    class="max-w-[700px] w-full font-mono text-black bg-white mx-auto outline-none px-8 pt-8 min-h-full resize-none field-sizing-content pb-64 break-words"
    placeholder="Start typing..."
    spellcheck="false"
></textarea>
