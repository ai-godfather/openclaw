import { html, nothing } from "lit";
import { formatAgo } from "../format";

/**
 * Props for the channel list component.
 */
export type ChannelListItem = {
  id: string;
  label: string;
  configured: boolean;
  running: boolean;
  connected: boolean;
  accountCount: number;
  lastActivity: number | null;
  hasError: boolean;
};

export type ChannelsListProps = {
  channels: ChannelListItem[];
  expandedChannelId: string | null;
  onChannelClick: (channelId: string) => void;
  onChannelCollapse?: () => void;
  /** Optional: renders inline detail content below the expanded channel row */
  renderDetailContent?: (channelId: string) => unknown;
};

/**
 * Renders a compact list of all channels with status indicators.
 * Each row shows: status dot, channel name, status summary, last activity, expand chevron.
 * Supports keyboard navigation: Arrow Up/Down, Enter/Space, Escape.
 */
export function renderChannelsList(props: ChannelsListProps) {
  const { channels, expandedChannelId, onChannelClick, onChannelCollapse, renderDetailContent } = props;

  /**
   * Handles keyboard navigation for the channel list.
   */
  function handleKeyDown(e: KeyboardEvent, channelId: string, index: number) {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        onChannelClick(channelId);
        break;

      case "Escape":
        e.preventDefault();
        if (onChannelCollapse) {
          onChannelCollapse();
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        focusRow(index + 1);
        break;

      case "ArrowUp":
        e.preventDefault();
        focusRow(index - 1);
        break;

      case "Home":
        e.preventDefault();
        focusRow(0);
        break;

      case "End":
        e.preventDefault();
        focusRow(channels.length - 1);
        break;
    }
  }

  /**
   * Focuses a channel row by index.
   */
  function focusRow(index: number) {
    const clampedIndex = Math.max(0, Math.min(index, channels.length - 1));
    const rows = document.querySelectorAll(".channels-list [role='option']");
    const row = rows[clampedIndex] as HTMLElement | undefined;
    if (row) {
      row.focus();
    }
  }

  return html`
    <div class="channels-list" role="listbox" aria-label="Channels">
      ${channels.map((channel, index) => {
        const isExpanded = expandedChannelId === channel.id;
        const statusClass = getStatusClass(channel);
        const statusSummary = getStatusSummary(channel);
        const lastActivityText = channel.lastActivity
          ? formatAgo(channel.lastActivity)
          : "n/a";

        return html`
          <div
            class="list-item list-item-clickable ${isExpanded ? "list-item-selected" : ""}"
            role="option"
            tabindex="0"
            aria-selected=${isExpanded}
            aria-label="${channel.label}: ${statusSummary}"
            @click=${() => onChannelClick(channel.id)}
            @keydown=${(e: KeyboardEvent) => handleKeyDown(e, channel.id, index)}
          >
            <div class="list-main">
              <div class="list-title">
                <span class="statusDot ${statusClass}"></span>
                ${channel.label}
              </div>
              <div class="list-sub">${statusSummary}</div>
            </div>
            <div class="list-meta">
              <span class="list-activity">${lastActivityText}</span>
              <span class="list-chevron" aria-hidden="true">${isExpanded ? "▾" : "▸"}</span>
            </div>
          </div>
          ${isExpanded && renderDetailContent ? renderDetailContent(channel.id) : nothing}
        `;
      })}
    </div>
  `;
}

/**
 * Determines the CSS class for the status dot based on channel state.
 */
function getStatusClass(channel: ChannelListItem): string {
  if (channel.hasError) return "error";
  if (channel.connected || channel.running) return "ok";
  if (channel.configured) return "configured";
  return "unconfigured";
}

/**
 * Generates a human-readable status summary for the channel.
 */
function getStatusSummary(channel: ChannelListItem): string {
  const parts: string[] = [];

  if (channel.hasError) {
    parts.push("Error");
  } else if (channel.connected) {
    parts.push("Connected");
  } else if (channel.running) {
    parts.push("Running");
  } else if (channel.configured) {
    parts.push("Configured");
  } else {
    parts.push("Not configured");
  }

  if (channel.accountCount > 1) {
    parts.push(`${channel.accountCount} accounts`);
  } else if (channel.accountCount === 1) {
    parts.push("1 account");
  }

  return parts.join(" · ");
}
