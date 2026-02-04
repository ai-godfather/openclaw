import { html, nothing } from "lit";
import type {
  ChannelAccountSnapshot,
  ChannelUiMetaEntry,
  ChannelsStatusSnapshot,
  DiscordStatus,
  GoogleChatStatus,
  IMessageStatus,
  NostrStatus,
  SignalStatus,
  SlackStatus,
  TelegramStatus,
  WhatsAppStatus,
} from "../types.ts";
import type {
  ChannelKey,
  ChannelListItem,
  ChannelsChannelData,
  ChannelsProps,
} from "./channels.types.ts";
import { formatAgo } from "../format.ts";
import { renderChannelDetail } from "./channels-detail.ts";
import { renderChannelsList } from "./channels-list.ts";
import { channelEnabled, formatDuration, getChannelAccountCount } from "./channels.shared.ts";

export function renderChannels(props: ChannelsProps) {
  const channelOrder = resolveChannelOrder(props.snapshot);
  const orderedChannels = channelOrder
    .map((key, index) => ({
      key,
      enabled: channelEnabled(key, props),
      order: index,
    }))
    .toSorted((a, b) => {
      if (a.enabled !== b.enabled) {
        return a.enabled ? -1 : 1;
      }
      return a.order - b.order;
    });

  const listItems = buildChannelListItems(
    props,
    orderedChannels.map((c) => c.key),
  );

  return html`
    <section class="channels-page">
      ${renderChannelsList({
        channels: listItems,
        expandedChannelId: props.expandedChannelId,
        onChannelClick: props.onChannelExpand,
        onChannelCollapse: props.onChannelCollapse,
        renderDetailContent: (channelId) => renderExpandedChannel(channelId, props),
      })}
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Channel health</div>
          <div class="card-sub">Channel status snapshots from the gateway.</div>
        </div>
        <div class="muted">${props.lastSuccessAt ? formatAgo(props.lastSuccessAt) : "n/a"}</div>
      </div>
      ${
        props.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${props.lastError}
          </div>`
          : nothing
      }
      <pre class="code-block" style="margin-top: 12px;">
${props.snapshot ? JSON.stringify(props.snapshot, null, 2) : "No snapshot yet."}
      </pre>
    </section>
  `;
}

/**
 * Builds the list items for the channel list from the props snapshot.
 */
function buildChannelListItems(props: ChannelsProps, orderedKeys: ChannelKey[]): ChannelListItem[] {
  return orderedKeys.map((key) => {
    const label = resolveChannelLabel(props.snapshot, key);
    const status = props.snapshot?.channels?.[key] as Record<string, unknown> | undefined;
    const configured = typeof status?.configured === "boolean" ? status.configured : false;
    const running = typeof status?.running === "boolean" ? status.running : false;
    const connected = typeof status?.connected === "boolean" ? status.connected : false;
    const hasError = typeof status?.lastError === "string" && status.lastError.length > 0;
    const accounts = props.snapshot?.channelAccounts?.[key] ?? [];
    const accountCount = getChannelAccountCount(key, props.snapshot?.channelAccounts ?? null);

    // Get last activity from accounts
    let lastActivity: number | null = null;
    for (const account of accounts) {
      if (
        account.lastInboundAt &&
        (lastActivity === null || account.lastInboundAt > lastActivity)
      ) {
        lastActivity = account.lastInboundAt;
      }
    }

    return {
      id: key,
      label,
      configured,
      running,
      connected,
      accountCount,
      lastActivity,
      hasError,
    };
  });
}

/**
 * Renders the expanded channel detail card for the selected channel.
 */
function renderExpandedChannel(channelId: ChannelKey, props: ChannelsProps) {
  const channels = props.snapshot?.channels as Record<string, unknown> | null;
  const whatsapp = (channels?.whatsapp ?? undefined) as WhatsAppStatus | undefined;
  const telegram = (channels?.telegram ?? undefined) as TelegramStatus | undefined;
  const discord = (channels?.discord ?? null) as DiscordStatus | null;
  const googlechat = (channels?.googlechat ?? null) as GoogleChatStatus | null;
  const slack = (channels?.slack ?? null) as SlackStatus | null;
  const signal = (channels?.signal ?? null) as SignalStatus | null;
  const imessage = (channels?.imessage ?? null) as IMessageStatus | null;
  const nostr = (channels?.nostr ?? null) as NostrStatus | null;

  const data: ChannelsChannelData = {
    whatsapp,
    telegram,
    discord,
    googlechat,
    slack,
    signal,
    imessage,
    nostr,
    channelAccounts: props.snapshot?.channelAccounts ?? null,
  };

  const label = resolveChannelLabel(props.snapshot, channelId);
  const accountCount = getChannelAccountCount(channelId, props.snapshot?.channelAccounts ?? null);

  return renderChannelDetail({
    channelId,
    channelLabel: label,
    activeTab: props.activeChannelTab,
    onTabChange: props.onChannelTabChange,
    onCollapse: props.onChannelCollapse,
    channelsProps: props,
    channelData: data,
    hideTabs: {
      accounts: accountCount < 2,
    },
    renderStatusContent: () => renderChannelStatus(channelId, props, data),
    renderAccountsContent: () => renderChannelAccounts(channelId, data),
    renderActionsContent: () => renderChannelActions(channelId, props, data),
  });
}

/**
 * Renders the status content for a channel.
 * Delegates to channel-specific status renderers for channels with unique fields.
 */
function renderChannelStatus(
  channelId: ChannelKey,
  props: ChannelsProps,
  data: ChannelsChannelData,
) {
  switch (channelId) {
    case "whatsapp":
      return renderWhatsAppStatus(data.whatsapp);
    case "telegram":
      return renderTelegramStatus(data.telegram);
    case "discord":
      return renderDiscordStatus(data.discord);
    case "slack":
      return renderSlackStatus(data.slack);
    case "signal":
      return renderSignalStatus(data.signal);
    case "imessage":
      return renderIMessageStatus(data.imessage);
    case "googlechat":
      return renderGoogleChatStatus(data.googlechat);
    case "nostr":
      return renderNostrStatus(data.nostr);
    default:
      return renderGenericStatus(channelId, props, data);
  }
}

/**
 * WhatsApp-specific status: linked, auth age, last connect/message.
 */
function renderWhatsAppStatus(whatsapp?: WhatsAppStatus) {
  return html`
    <div class="status-list">
      <div>
        <span class="label">Configured</span>
        <span>${whatsapp?.configured ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Linked</span>
        <span>${whatsapp?.linked ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Running</span>
        <span>${whatsapp?.running ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Connected</span>
        <span>${whatsapp?.connected ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Last connect</span>
        <span>${whatsapp?.lastConnectedAt ? formatAgo(whatsapp.lastConnectedAt) : "n/a"}</span>
      </div>
      <div>
        <span class="label">Last message</span>
        <span>${whatsapp?.lastMessageAt ? formatAgo(whatsapp.lastMessageAt) : "n/a"}</span>
      </div>
      <div>
        <span class="label">Auth age</span>
        <span>${whatsapp?.authAgeMs != null ? formatDuration(whatsapp.authAgeMs) : "n/a"}</span>
      </div>
    </div>
    ${
      whatsapp?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">${whatsapp.lastError}</div>`
        : nothing
    }
  `;
}

/**
 * Telegram-specific status: mode, last start/probe, probe result.
 */
function renderTelegramStatus(telegram?: TelegramStatus) {
  return html`
    <div class="status-list">
      <div>
        <span class="label">Configured</span>
        <span>${telegram?.configured ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Running</span>
        <span>${telegram?.running ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Mode</span>
        <span>${telegram?.mode ?? "n/a"}</span>
      </div>
      <div>
        <span class="label">Last start</span>
        <span>${telegram?.lastStartAt ? formatAgo(telegram.lastStartAt) : "n/a"}</span>
      </div>
      <div>
        <span class="label">Last probe</span>
        <span>${telegram?.lastProbeAt ? formatAgo(telegram.lastProbeAt) : "n/a"}</span>
      </div>
    </div>
    ${
      telegram?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">${telegram.lastError}</div>`
        : nothing
    }
    ${
      telegram?.probe
        ? html`<div class="callout ${telegram.probe.ok ? "info" : "danger"}" style="margin-top: 12px;">
          Probe ${telegram.probe.ok ? "ok" : "failed"} · ${telegram.probe.status ?? ""} ${telegram.probe.error ?? ""}
        </div>`
        : nothing
    }
  `;
}

/**
 * Discord-specific status: last start/probe, probe result.
 */
function renderDiscordStatus(discord?: DiscordStatus | null) {
  return html`
    <div class="status-list">
      <div>
        <span class="label">Configured</span>
        <span>${discord?.configured ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Running</span>
        <span>${discord?.running ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Last start</span>
        <span>${discord?.lastStartAt ? formatAgo(discord.lastStartAt) : "n/a"}</span>
      </div>
      <div>
        <span class="label">Last probe</span>
        <span>${discord?.lastProbeAt ? formatAgo(discord.lastProbeAt) : "n/a"}</span>
      </div>
    </div>
    ${
      discord?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">${discord.lastError}</div>`
        : nothing
    }
    ${
      discord?.probe
        ? html`<div class="callout ${discord.probe.ok ? "info" : "danger"}" style="margin-top: 12px;">
          Probe ${discord.probe.ok ? "ok" : "failed"} · ${discord.probe.status ?? ""} ${discord.probe.error ?? ""}
        </div>`
        : nothing
    }
  `;
}

/**
 * Slack-specific status.
 */
function renderSlackStatus(slack?: SlackStatus | null) {
  return html`
    <div class="status-list">
      <div>
        <span class="label">Configured</span>
        <span>${slack?.configured ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Running</span>
        <span>${slack?.running ? "Yes" : "No"}</span>
      </div>
    </div>
    ${
      slack?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">${slack.lastError}</div>`
        : nothing
    }
  `;
}

/**
 * Signal-specific status.
 */
function renderSignalStatus(signal?: SignalStatus | null) {
  return html`
    <div class="status-list">
      <div>
        <span class="label">Configured</span>
        <span>${signal?.configured ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Running</span>
        <span>${signal?.running ? "Yes" : "No"}</span>
      </div>
    </div>
    ${
      signal?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">${signal.lastError}</div>`
        : nothing
    }
  `;
}

/**
 * iMessage-specific status.
 */
function renderIMessageStatus(imessage?: IMessageStatus | null) {
  return html`
    <div class="status-list">
      <div>
        <span class="label">Configured</span>
        <span>${imessage?.configured ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Running</span>
        <span>${imessage?.running ? "Yes" : "No"}</span>
      </div>
    </div>
    ${
      imessage?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">${imessage.lastError}</div>`
        : nothing
    }
  `;
}

/**
 * Google Chat-specific status.
 */
function renderGoogleChatStatus(googlechat?: GoogleChatStatus | null) {
  return html`
    <div class="status-list">
      <div>
        <span class="label">Configured</span>
        <span>${googlechat?.configured ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Running</span>
        <span>${googlechat?.running ? "Yes" : "No"}</span>
      </div>
    </div>
    ${
      googlechat?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">${googlechat.lastError}</div>`
        : nothing
    }
  `;
}

/**
 * Nostr-specific status.
 */
function renderNostrStatus(nostr?: NostrStatus | null) {
  return html`
    <div class="status-list">
      <div>
        <span class="label">Configured</span>
        <span>${nostr?.configured ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Running</span>
        <span>${nostr?.running ? "Yes" : "No"}</span>
      </div>
    </div>
    ${
      nostr?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">${nostr.lastError}</div>`
        : nothing
    }
  `;
}

/**
 * Generic status for unknown or extension channels.
 */
function renderGenericStatus(
  channelId: ChannelKey,
  props: ChannelsProps,
  data: ChannelsChannelData,
) {
  const status = props.snapshot?.channels?.[channelId] as Record<string, unknown> | undefined;
  const configured = typeof status?.configured === "boolean" ? status.configured : undefined;
  const running = typeof status?.running === "boolean" ? status.running : undefined;
  const connected = typeof status?.connected === "boolean" ? status.connected : undefined;
  const lastError = typeof status?.lastError === "string" ? status.lastError : undefined;
  const accounts = data.channelAccounts?.[channelId] ?? [];
  const lastInbound = accounts[0]?.lastInboundAt ?? null;

  return html`
    <div class="status-list">
      <div>
        <span class="label">Configured</span>
        <span>${configured == null ? "n/a" : configured ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Running</span>
        <span>${running == null ? "n/a" : running ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Connected</span>
        <span>${connected == null ? "n/a" : connected ? "Yes" : "No"}</span>
      </div>
      <div>
        <span class="label">Last message</span>
        <span>${lastInbound ? formatAgo(lastInbound) : "n/a"}</span>
      </div>
    </div>
    ${
      lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">${lastError}</div>`
        : nothing
    }
  `;
}

/**
 * Renders the accounts content for a channel.
 */
function renderChannelAccounts(channelId: ChannelKey, data: ChannelsChannelData) {
  const accounts = data.channelAccounts?.[channelId] ?? [];

  if (accounts.length === 0) {
    return html`
      <div class="channel-detail__placeholder">
        <span class="muted">No accounts configured.</span>
      </div>
    `;
  }

  return html`
    <div class="account-card-list">
      ${accounts.map((account) => renderGenericAccount(account))}
    </div>
  `;
}

/**
 * Renders the actions content for a channel.
 * Delegates to channel-specific action renderers for special channels.
 */
function renderChannelActions(
  channelId: ChannelKey,
  props: ChannelsProps,
  data: ChannelsChannelData,
) {
  switch (channelId) {
    case "whatsapp":
      return renderWhatsAppActions(props, data.whatsapp);
    case "telegram":
    case "discord":
    case "slack":
    case "signal":
    case "googlechat":
      return renderProbeActions(props);
    default:
      return html`
        <div class="channel-detail__placeholder">
          <span class="muted">No actions available for this channel.</span>
        </div>
      `;
  }
}

/**
 * Renders WhatsApp-specific actions (QR login, logout).
 */
function renderWhatsAppActions(props: ChannelsProps, whatsapp?: WhatsAppStatus) {
  const showQr = props.whatsappQrDataUrl !== null;

  return html`
    <div class="btn-row" style="margin-bottom: 16px;">
      <button
        class="btn"
        ?disabled=${props.whatsappBusy}
        @click=${() => props.onWhatsAppStart(false)}
      >
        ${showQr ? "Refresh QR" : "Show QR Code"}
      </button>
      ${
        whatsapp?.linked
          ? html`
            <button
              class="btn btn-danger"
              ?disabled=${props.whatsappBusy}
              @click=${() => props.onWhatsAppLogout()}
            >
              Logout
            </button>
          `
          : nothing
      }
    </div>
    ${
      showQr
        ? html`
          <div class="whatsapp-qr">
            <img src=${props.whatsappQrDataUrl!} alt="WhatsApp QR Code" />
          </div>
        `
        : nothing
    }
    ${
      props.whatsappMessage
        ? html`<div class="callout info">${props.whatsappMessage}</div>`
        : nothing
    }
  `;
}

/**
 * Renders probe action for channels that support connection probing.
 */
function renderProbeActions(props: ChannelsProps) {
  return html`
    <div class="btn-row">
      <button class="btn" @click=${() => props.onRefresh(true)}>
        Probe Connection
      </button>
    </div>
  `;
}

function resolveChannelOrder(snapshot: ChannelsStatusSnapshot | null): ChannelKey[] {
  if (snapshot?.channelMeta?.length) {
    return snapshot.channelMeta.map((entry) => entry.id);
  }
  if (snapshot?.channelOrder?.length) {
    return snapshot.channelOrder;
  }
  return ["whatsapp", "telegram", "discord", "googlechat", "slack", "signal", "imessage", "nostr"];
}

function resolveChannelMetaMap(
  snapshot: ChannelsStatusSnapshot | null,
): Record<string, ChannelUiMetaEntry> {
  if (!snapshot?.channelMeta?.length) {
    return {};
  }
  return Object.fromEntries(snapshot.channelMeta.map((entry) => [entry.id, entry]));
}

function resolveChannelLabel(snapshot: ChannelsStatusSnapshot | null, key: string): string {
  const meta = resolveChannelMetaMap(snapshot)[key];
  return meta?.label ?? snapshot?.channelLabels?.[key] ?? key;
}

const RECENT_ACTIVITY_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

function hasRecentActivity(account: ChannelAccountSnapshot): boolean {
  if (!account.lastInboundAt) {
    return false;
  }
  return Date.now() - account.lastInboundAt < RECENT_ACTIVITY_THRESHOLD_MS;
}

function deriveRunningStatus(account: ChannelAccountSnapshot): "Yes" | "No" | "Active" {
  if (account.running) {
    return "Yes";
  }
  if (hasRecentActivity(account)) {
    return "Active";
  }
  return "No";
}

function deriveConnectedStatus(account: ChannelAccountSnapshot): "Yes" | "No" | "Active" | "n/a" {
  if (account.connected === true) {
    return "Yes";
  }
  if (account.connected === false) {
    return "No";
  }
  if (hasRecentActivity(account)) {
    return "Active";
  }
  return "n/a";
}

function renderGenericAccount(account: ChannelAccountSnapshot) {
  const runningStatus = deriveRunningStatus(account);
  const connectedStatus = deriveConnectedStatus(account);

  return html`
    <div class="account-card">
      <div class="account-card-header">
        <div class="account-card-title">${account.name || account.accountId}</div>
        <div class="account-card-id">${account.accountId}</div>
      </div>
      <div class="status-list account-card-status">
        <div>
          <span class="label">Running</span>
          <span>${runningStatus}</span>
        </div>
        <div>
          <span class="label">Configured</span>
          <span>${account.configured ? "Yes" : "No"}</span>
        </div>
        <div>
          <span class="label">Connected</span>
          <span>${connectedStatus}</span>
        </div>
        <div>
          <span class="label">Last inbound</span>
          <span>${account.lastInboundAt ? formatAgo(account.lastInboundAt) : "n/a"}</span>
        </div>
        ${
          account.lastError
            ? html`
              <div class="account-card-error">
                ${account.lastError}
              </div>
            `
            : nothing
        }
      </div>
    </div>
  `;
}
