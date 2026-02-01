import type {
  ChannelAccountSnapshot,
  ChannelsStatusSnapshot,
  ConfigUiHints,
  DiscordStatus,
  GoogleChatStatus,
  IMessageStatus,
  NostrProfile,
  NostrStatus,
  SignalStatus,
  SlackStatus,
  TelegramStatus,
  WhatsAppStatus,
} from "../types.ts";
import type { NostrProfileFormState } from "./channels.nostr-profile-form.ts";

export type ChannelKey = string;

/**
 * Tab identifiers for the layered channel detail view.
 */
export type ChannelTab = "status" | "accounts" | "config" | "actions";

/**
 * Summary data for a channel in the compact list view.
 */
export type ChannelListItem = {
  id: ChannelKey;
  label: string;
  configured: boolean;
  running: boolean;
  connected: boolean;
  accountCount: number;
  lastActivity: number | null;
  hasError: boolean;
};

export type ChannelsProps = {
  connected: boolean;
  loading: boolean;
  snapshot: ChannelsStatusSnapshot | null;
  lastError: string | null;
  lastSuccessAt: number | null;
  whatsappMessage: string | null;
  whatsappQrDataUrl: string | null;
  whatsappConnected: boolean | null;
  whatsappBusy: boolean;
  configSchema: unknown;
  configSchemaLoading: boolean;
  configForm: Record<string, unknown> | null;
  configUiHints: ConfigUiHints;
  configSaving: boolean;
  configFormDirty: boolean;
  nostrProfileFormState: NostrProfileFormState | null;
  nostrProfileAccountId: string | null;
  // Layered UI state
  expandedChannelId: string | null;
  activeChannelTab: ChannelTab;
  onChannelExpand: (channelId: string) => void;
  onChannelCollapse: () => void;
  onChannelTabChange: (tab: ChannelTab) => void;
  onRefresh: (probe: boolean) => void;
  onWhatsAppStart: (force: boolean) => void;
  onWhatsAppWait: () => void;
  onWhatsAppLogout: () => void;
  onConfigPatch: (path: Array<string | number>, value: unknown) => void;
  onConfigSave: () => void;
  onConfigReload: () => void;
  onNostrProfileEdit: (accountId: string, profile: NostrProfile | null) => void;
  onNostrProfileCancel: () => void;
  onNostrProfileFieldChange: (field: keyof NostrProfile, value: string) => void;
  onNostrProfileSave: () => void;
  onNostrProfileImport: () => void;
  onNostrProfileToggleAdvanced: () => void;
};

export type ChannelsChannelData = {
  whatsapp?: WhatsAppStatus;
  telegram?: TelegramStatus;
  discord?: DiscordStatus | null;
  googlechat?: GoogleChatStatus | null;
  slack?: SlackStatus | null;
  signal?: SignalStatus | null;
  imessage?: IMessageStatus | null;
  nostr?: NostrStatus | null;
  channelAccounts?: Record<string, ChannelAccountSnapshot[]> | null;
};

/**
 * Parameters for rendering channel status content.
 */
export type ChannelStatusParams<T> = {
  props: ChannelsProps;
  status: T | null;
  accounts: ChannelAccountSnapshot[];
};

/**
 * Parameters for rendering channel config content.
 */
export type ChannelConfigParams = {
  props: ChannelsProps;
  channelId: string;
};

/**
 * Parameters for rendering channel actions content.
 */
export type ChannelActionsParams = {
  props: ChannelsProps;
  channelId: string;
};

/**
 * Definition for a single tab in the channel detail view.
 * Re-exported for convenience; primary definition in channels-tabs.ts.
 */
export type ChannelTabDef = {
  id: ChannelTab;
  label: string;
  disabled?: boolean;
  hidden?: boolean;
};
