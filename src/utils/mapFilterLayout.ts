/** Reserve gap between filter panel and map chrome (px). */
const FILTER_LAYOUT_GAP = 8;
const FILTER_MIN_HEIGHT = 120;

function boxesOverlapX(aLeft: number, aRight: number, bLeft: number, bRight: number): boolean {
  return aLeft < bRight && aRight > bLeft;
}

/**
 * Fit map filter within the map shell: max-height avoids legend overlap;
 * width is pinned to the search column so open/collapsed stay the same width.
 */
export function syncMapFilterLayoutMetrics(
  shell: HTMLElement | null,
  panel: HTMLElement | null,
  bottomStack: HTMLElement | null,
  searchColumn: HTMLElement | null,
): void {
  if (!shell) return;

  if (!panel) {
    shell.style.removeProperty('--map-filter-max-height');
    shell.style.removeProperty('--map-filter-panel-width');
    return;
  }

  const shellRect = shell.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const topInShell = panelRect.top - shellRect.top;

  let maxBottom = shell.clientHeight - FILTER_LAYOUT_GAP;

  if (bottomStack) {
    const stackRect = bottomStack.getBoundingClientRect();
    const stackTop = stackRect.top - shellRect.top;
    const stackLeft = stackRect.left - shellRect.left;
    const stackRight = stackRect.right - shellRect.left;
    const panelLeft = panelRect.left - shellRect.left;
    const panelRight = panelRect.right - shellRect.left;

    if (boxesOverlapX(panelLeft, panelRight, stackLeft, stackRight)) {
      maxBottom = Math.min(maxBottom, stackTop - FILTER_LAYOUT_GAP);
    }
  }

  const maxHeight = Math.max(FILTER_MIN_HEIGHT, maxBottom - topInShell);
  shell.style.setProperty('--map-filter-max-height', `${maxHeight}px`);

  const searchWidth = searchColumn?.offsetWidth ?? 0;
  if (searchWidth > 0) {
    shell.style.setProperty('--map-filter-panel-width', `${searchWidth}px`);
  } else {
    shell.style.removeProperty('--map-filter-panel-width');
  }
}
