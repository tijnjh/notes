<script lang="ts">
  import { XIcon } from "@lucide/svelte";
  import type { Note } from "../types";
  import { Button } from "./ui/button";
  import { scale, slide } from "svelte/transition";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";

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

  let isHovering = $state(false);
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="group flex"
  onmouseenter={() => void (isHovering = true)}
  onmouseleave={() => void (isHovering = false)}
>
  <Button onclick={onSelect} variant={isActive ? "default" : "outline"}>
    <span class="flex-1 font-mono truncate">
      {preview()}
    </span>
  </Button>

  <AlertDialog.Root>
    {#if isHovering}
      <div transition:scale={{ start: 0.5 }}>
        <div transition:slide={{ axis: "x" }}>
          <AlertDialog.Trigger>
            <Button size="icon" variant="destructive" class="ml-1">
              <XIcon class="size-4" />
            </Button>
          </AlertDialog.Trigger>
        </div>
      </div>
    {/if}
    <AlertDialog.Content>
      Are you sure you want to delete this note?
      <AlertDialog.Footer>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action onclick={() => void onDelete(note.id)}>
          Yes
        </AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
</div>
