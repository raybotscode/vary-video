import {useRef, type KeyboardEvent} from 'react';

export type ComposerTabId = 'scenes' | 'content';

type ComposerTabsProps = {
  activeTab: ComposerTabId;
  onChange: (tab: ComposerTabId) => void;
  hasSelectedBlock: boolean;
};

const TABS: Array<{id: ComposerTabId; label: string}> = [
  {id: 'scenes', label: 'Scenes'},
  {id: 'content', label: 'Content'},
];

/**
 * Mobile composer segmented control (Scenes / Content) with a complete
 * ARIA tab pattern: aria-controls/aria-labelledby wiring, tabpanel roles,
 * and arrow-key navigation. Desktop layout hides this and shows the
 * timeline + editor side by side.
 */
export default function ComposerTabs({
  activeTab,
  onChange,
  hasSelectedBlock,
}: ComposerTabsProps) {
  const tabRefs = useRef<Record<ComposerTabId, HTMLButtonElement | null>>({
    scenes: null,
    content: null,
  });

  const isTabEnabled = (id: ComposerTabId): boolean =>
    id === 'scenes' || hasSelectedBlock;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = TABS.findIndex((tab) => tab.id === activeTab);
    let nextIndex = index;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % TABS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();

    // Skip disabled tabs (e.g. Content with no selected block) when navigating
    // with the keyboard, so a disabled tab can never become active.
    let candidate = TABS[nextIndex];
    if (!isTabEnabled(candidate.id)) {
      const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const start = nextIndex;
      let cursor = (nextIndex + step + TABS.length) % TABS.length;
      while (cursor !== start) {
        candidate = TABS[cursor];
        if (isTabEnabled(candidate.id)) {
          break;
        }
        cursor = (cursor + step + TABS.length) % TABS.length;
      }
    }

    if (isTabEnabled(candidate.id) && candidate.id !== activeTab) {
      onChange(candidate.id);
      tabRefs.current[candidate.id]?.focus();
    }
  };

  return (
    <div className="composer-tabs" role="tablist" aria-label="Composer sections">
      {TABS.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(element) => {
              tabRefs.current[tab.id] = element;
            }}
            type="button"
            role="tab"
            id={`composer-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`composer-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={selected ? 'composer-tab active' : 'composer-tab'}
            onClick={() => onChange(tab.id)}
            onKeyDown={onKeyDown}
            disabled={!isTabEnabled(tab.id)}
            title={!isTabEnabled(tab.id) ? 'Select a scene first' : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
