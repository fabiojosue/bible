const ARROW_KEY_WIDGETS = [
  "input",
  "textarea",
  "select",
  "[contenteditable='true']",
  "[role='dialog']",
  "[role='alertdialog']",
  "[role='menu']",
  "[role='listbox']",
  "[role='slider']",
  "[role='tablist']",
  "[role='radiogroup']",
  "[role='group']",
].join(",");

/** True when a key press belongs to a focused widget rather than to page-level shortcuts. */
export function isInsideInteractiveWidget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(ARROW_KEY_WIDGETS) !== null;
}

export function hasModifier(event: KeyboardEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}
