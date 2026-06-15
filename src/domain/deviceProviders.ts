export type DeviceProviderKey =
  | 'manual'
  | 'iosScreenTime'
  | 'googleFamilyLinkGuide'
  | 'playstationGuide'
  | 'microsoftGuide'
  | 'desktopAgent'
  | 'routerIntegration';

export type DeviceProvider = {
  key: DeviceProviderKey;
  name: string;
  platform: string;
  status: 'v1_supported' | 'v15_candidate' | 'future';
  directAutomation: boolean;
  setupSteps: string[];
  guardrail: string;
};

export const deviceProviders: DeviceProvider[] = [
  {
    key: 'manual',
    name: 'Manual family agreement',
    platform: 'Any device',
    status: 'v1_supported',
    directAutomation: false,
    setupSteps: [
      'Create a daily screen-time bank in KudoLoop.',
      'Have kids request redemptions before starting play.',
      'Parents mark time fulfilled after applying the family rule.',
    ],
    guardrail: 'Never claims automated locking; it is a transparent tracking and approval workflow.',
  },
  {
    key: 'iosScreenTime',
    name: 'Apple Screen Time',
    platform: 'iPhone and iPad',
    status: 'v15_candidate',
    directAutomation: true,
    setupSteps: [
      'Enable Family Sharing and Screen Time for the child account.',
      'Use App Limits or Downtime for baseline rules.',
      'For V1.5, request Apple Screen Time API entitlements before shipping app shielding.',
    ],
    guardrail: 'Direct app shielding ships only after entitlement approval and App Review validation.',
  },
  {
    key: 'googleFamilyLinkGuide',
    name: 'Google Family Link',
    platform: 'Android and Chromebook',
    status: 'v1_supported',
    directAutomation: false,
    setupSteps: [
      'Create or connect the child Google account in Family Link.',
      'Set daily limits, downtime, and app-specific rules.',
      'Use KudoLoop balances to decide when to grant extra time manually.',
    ],
    guardrail: 'KudoLoop does not impersonate Family Link or use unsupported private APIs.',
  },
  {
    key: 'playstationGuide',
    name: 'PlayStation Family App',
    platform: 'PS5 and PS4',
    status: 'v1_supported',
    directAutomation: false,
    setupSteps: [
      'Set up a child account in PlayStation Family Management.',
      'Configure playtime limits for each day of the week.',
      'Approve extra playtime in the PlayStation Family App after KudoLoop approval.',
    ],
    guardrail: 'KudoLoop guides parents to Sony controls and does not claim direct PS5 automation.',
  },
  {
    key: 'microsoftGuide',
    name: 'Microsoft Family Safety',
    platform: 'Windows and Xbox',
    status: 'v1_supported',
    directAutomation: false,
    setupSteps: [
      'Create child Microsoft accounts and connect them to Family Safety.',
      'Set device, app, and game limits for Windows and Xbox.',
      'Use KudoLoop redemptions as the parent decision layer.',
    ],
    guardrail: 'No unsupported Microsoft Family Safety API calls are used.',
  },
  {
    key: 'desktopAgent',
    name: 'Desktop agent',
    platform: 'Mac and Windows',
    status: 'future',
    directAutomation: true,
    setupSteps: ['Design a separately installed helper with explicit parent consent.'],
    guardrail: 'Future only; requires security review, signed binaries, and uninstall protections.',
  },
  {
    key: 'routerIntegration',
    name: 'Router integration',
    platform: 'Home network',
    status: 'future',
    directAutomation: true,
    setupSteps: ['Evaluate supported router APIs for device-level pause and schedules.'],
    guardrail: 'Future only; must not break educational or emergency access.',
  },
];
