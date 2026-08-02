export type ComposerTabId = 'scenes' | 'content';

type ComposerTabsProps = {
  activeTab: ComposerTabId;
  onChange: (tab: ComposerTabId) => void;
  hasSelectedBlock: boolean;
};

/**
 * Mobile composer segmented control (Scenes / Content).
 * Desktop layout hides this and shows timeline + editor side by side.
 */
export default function ComposerTabs({
  activeTab,
  onChange,
  hasSelectedBlock,
}: ComposerTabsProps) {
  return (
    <div className="composer-tabs" role="tablist" aria-label="Composer sections">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'scenes'}
        className={activeTab === 'scenes' ? 'composer-tab active' : 'composer-tab'}
        onClick={() => onChange('scenes')}
      >
        Scenes
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'content'}
        className={activeTab === 'content' ? 'composer-tab active' : 'composer-tab'}
        onClick={() => onChange('content')}
        disabled={!hasSelectedBlock}
        title={hasSelectedBlock ? 'Edit the selected scene' : 'Select a scene first'}
      >
        Content
      </button>
    </div>
  );
}
