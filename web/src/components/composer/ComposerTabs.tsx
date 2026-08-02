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
    const next = TABS[nextIndex];
    onChange(next.id);
    tabRefs.current[next.id]?.focus();
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
            disabled={tab.id === 'content' && !hasSelectedBlock}
            title={tab.id === 'content' && !hasSelectedBlock ? 'Select a scene first' : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
