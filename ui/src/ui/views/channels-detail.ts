import { html, nothing } from "lit";
import type { ChannelTab, ChannelsChannelData, ChannelsProps } from "./channels.types";
import {
  createDefaultChannelTabs,
  renderChannelTabs,
  type ChannelTabDef,
} from "./channels-tabs";
import { renderChannelConfigSection } from "./channels.config";

/**
 * Props for the channel detail wrapper component.
 */
export type ChannelDetailProps = {
  channelId: string;
  channelLabel: string;
  activeTab: ChannelTab;
  onTabChange: (tab: ChannelTab) => void;
  onCollapse: () => void;
  // Pass-through to channel-specific renderers
  channelsProps: ChannelsProps;
  channelData: ChannelsChannelData;
  // Tab customization
  hideTabs?: {
    accounts?: boolean;
    actions?: boolean;
  };
  // Slot renderers for channel-specific content
  renderStatusContent?: () => unknown;
  renderAccountsContent?: () => unknown;
  renderActionsContent?: () => unknown;
};

/**
 * Renders the expandable detail card for a selected channel.
 * Includes tab navigation and content area.
 */
export function renderChannelDetail(props: ChannelDetailProps) {
  const {
    channelId,
    channelLabel,
    activeTab,
    onTabChange,
    onCollapse,
    channelsProps,
    hideTabs,
    renderStatusContent,
    renderAccountsContent,
    renderActionsContent,
  } = props;

  const tabs: ChannelTabDef[] = createDefaultChannelTabs({
    hideAccounts: hideTabs?.accounts,
    hideActions: hideTabs?.actions,
  });

  return html`
    <div class="channel-detail channel-detail--expanded">
      <div class="channel-detail__header">
        <span class="channel-detail__title">${channelLabel}</span>
        <button
          class="channel-detail__close btn btn-ghost"
          @click=${onCollapse}
          aria-label="Collapse channel"
        >
          ✕
        </button>
      </div>
      <div class="channel-detail__tabs">
        ${renderChannelTabs({
          tabs,
          activeTab,
          onTabChange,
        })}
      </div>
      <div class="channel-detail__content">
        ${renderTabContent({
          channelId,
          activeTab,
          channelsProps,
          renderStatusContent,
          renderAccountsContent,
          renderActionsContent,
        })}
      </div>
    </div>
  `;
}

/**
 * Renders the content for the active tab.
 */
function renderTabContent(params: {
  channelId: string;
  activeTab: ChannelTab;
  channelsProps: ChannelsProps;
  renderStatusContent?: () => unknown;
  renderAccountsContent?: () => unknown;
  renderActionsContent?: () => unknown;
}) {
  const {
    channelId,
    activeTab,
    channelsProps,
    renderStatusContent,
    renderAccountsContent,
    renderActionsContent,
  } = params;

  switch (activeTab) {
    case "status":
      return renderStatusContent ? renderStatusContent() : renderDefaultStatus();

    case "accounts":
      return renderAccountsContent
        ? renderAccountsContent()
        : renderDefaultAccounts();

    case "config":
      return renderChannelConfigSection({ channelId, props: channelsProps });

    case "actions":
      return renderActionsContent ? renderActionsContent() : renderDefaultActions();

    default:
      return nothing;
  }
}

/**
 * Default status content when no custom renderer is provided.
 */
function renderDefaultStatus() {
  return html`
    <div class="channel-detail__placeholder">
      <span class="muted">No status information available.</span>
    </div>
  `;
}

/**
 * Default accounts content when no custom renderer is provided.
 */
function renderDefaultAccounts() {
  return html`
    <div class="channel-detail__placeholder">
      <span class="muted">No accounts configured.</span>
    </div>
  `;
}

/**
 * Default actions content when no custom renderer is provided.
 */
function renderDefaultActions() {
  return html`
    <div class="channel-detail__placeholder">
      <span class="muted">No actions available for this channel.</span>
    </div>
  `;
}
