export type IntegrationName = 'twitch' | 'youtube';

export interface IntegrationConfig {
    name: IntegrationName;
    enabled: boolean;
    clientId: string | null;
    clientSecret: string | null;
}

export class IntegrationsConfig {
    private configs: Map<IntegrationName, IntegrationConfig> = new Map();

    constructor() {
        this.initializeConfigs();
    }

    private initializeConfigs() {
        // Twitch configuration
        const twitchConfig: IntegrationConfig = {
            name: 'twitch',
            enabled: !!(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET),
            clientId: process.env.TWITCH_CLIENT_ID || null,
            clientSecret: process.env.TWITCH_CLIENT_SECRET || null
        };
        this.configs.set('twitch', twitchConfig);

        // YouTube configuration
        const youtubeConfig: IntegrationConfig = {
            name: 'youtube',
            enabled: !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
            clientId: process.env.YOUTUBE_CLIENT_ID || null,
            clientSecret: process.env.YOUTUBE_CLIENT_SECRET || null
        };
        this.configs.set('youtube', youtubeConfig);
    }

    isEnabled(integration: IntegrationName): boolean {
        return this.configs.get(integration)?.enabled || false;
    }

    getConfig(integration: IntegrationName): IntegrationConfig | null {
        return this.configs.get(integration) || null;
    }

    getEnabledIntegrations(): IntegrationName[] {
        return Array.from(this.configs.values())
            .filter(config => config.enabled)
            .map(config => config.name);
    }

    getAllConfigs(): IntegrationConfig[] {
        return Array.from(this.configs.values());
    }

    hasAnyEnabled(): boolean {
        return this.getEnabledIntegrations().length > 0;
    }
}

export const integrationsConfig = new IntegrationsConfig();
