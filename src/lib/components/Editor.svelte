<script lang="ts">
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
  class="bg-white mx-auto px-8 pt-8 pb-64 outline-none w-full max-w-[700px] min-h-full font-mono text-black break-words field-sizing-content resize-none"
  placeholder="Start typing..."
  spellcheck="false"
></textarea>
