import { html, nothing } from "lit";

/**
 * Definition for a single tab in the channel detail view.
 */
export type ChannelTabDef = {
  id: string;
  label: string;
  disabled?: boolean;
  hidden?: boolean;
};

/**
 * Props for the channel tabs component.
 */
export type ChannelTabsProps = {
  tabs: ChannelTabDef[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

/**
 * Standard tab definitions for channel detail views.
 * Tab order: Status, Accounts, Config, Actions.
 */
export const CHANNEL_TAB_IDS = {
  STATUS: "status",
  ACCOUNTS: "accounts",
  CONFIG: "config",
  ACTIONS: "actions",
} as const;

export type ChannelTabId = (typeof CHANNEL_TAB_IDS)[keyof typeof CHANNEL_TAB_IDS];

/**
 * Renders a horizontal tab bar for the channel detail view.
 */
export function renderChannelTabs(props: ChannelTabsProps) {
  const { tabs, activeTab, onTabChange } = props;

  const visibleTabs = tabs.filter((tab) => !tab.hidden);

  return html`
    <div class="channel-tabs" role="tablist">
      ${visibleTabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isDisabled = tab.disabled === true;

        const classes = [
          "channel-tabs__tab",
          isActive ? "channel-tabs__tab--active" : "",
          isDisabled ? "channel-tabs__tab--disabled" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return html`
          <button
            class=${classes}
            role="tab"
            aria-selected=${isActive}
            aria-disabled=${isDisabled}
            tabindex=${isDisabled ? -1 : 0}
            ?disabled=${isDisabled}
            @click=${() => {
              if (!isDisabled) {
                onTabChange(tab.id);
              }
            }}
          >
            ${tab.label}
          </button>
        `;
      })}
    </div>
  `;
}

/**
 * Creates the default tab definitions for a channel.
 * Optionally hides the Accounts tab for single-account channels.
 */
export function createDefaultChannelTabs(options?: {
  hideAccounts?: boolean;
  hideActions?: boolean;
}): ChannelTabDef[] {
  return [
    { id: CHANNEL_TAB_IDS.STATUS, label: "Status" },
    {
      id: CHANNEL_TAB_IDS.ACCOUNTS,
      label: "Accounts",
      hidden: options?.hideAccounts,
    },
    { id: CHANNEL_TAB_IDS.CONFIG, label: "Config" },
    {
      id: CHANNEL_TAB_IDS.ACTIONS,
      label: "Actions",
      hidden: options?.hideActions,
    },
  ];
}
