import type { IntegrationName } from './integration-config';
import { integrationsConfig } from './integration-config';
import { tokenManager } from './token-manager';
import { IntegrationManager } from './integration-manager';

export type StartupState = 'checking' | 'needs_auth' | 'starting_integrations' | 'ready' | 'error';

export class StartupManager {
    private state: StartupState = 'checking';
    private integrationManager: IntegrationManager;
    private startupPromise: Promise<void> | null = null;

    constructor(integrationManager: IntegrationManager) {
        this.integrationManager = integrationManager;
    }

    async initialize(): Promise<void> {
        if (this.startupPromise) {
            return this.startupPromise;
        }

        this.startupPromise = this.performInitialization();
        return this.startupPromise;
    }

    private async performInitialization(): Promise<void> {
        console.log('🚀 Starting KremStream Neo initialization...');

        this.state = 'checking';

        // Check which integrations are enabled via environment variables
        const enabledIntegrations = integrationsConfig.getEnabledIntegrations();

        if (enabledIntegrations.length === 0) {
            console.log('❌ No integrations enabled. Please set environment variables:');
            console.log('   - For Twitch: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET');
            console.log('   - For YouTube: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET');
            this.state = 'error';
            return;
        }

        console.log(`🔍 Enabled integrations: ${enabledIntegrations.join(', ')}`);

        // Check token states for all enabled integrations
        const tokenStates = await tokenManager.checkAllTokens(enabledIntegrations);

        // Display token status
        for (const state of tokenStates) {
            const status = this.getStatusEmoji(state.status);
            console.log(`${status} ${state.integration}: ${state.status}`);
        }

        const needingAuth = tokenManager.getIntegrationsNeedingAuth();

        if (needingAuth.length > 0) {
            this.state = 'needs_auth';
            console.log('\n🔐 Authentication required:');
            const authMessages = tokenManager.generateAuthPrompt();
            authMessages.forEach(msg => console.log(`   ${msg}`));
            console.log('\nServer will wait for authentication before proceeding...\n');

            // Wait for all required authentications
            await this.waitForAuthentications(enabledIntegrations);
        }

        // All tokens are ready, start integrations
        this.state = 'starting_integrations';
        console.log('🎯 Starting integrations...');

        const readyIntegrations = tokenManager.getReadyIntegrations();
        const startedIntegrations: string[] = [];

        for (const integration of readyIntegrations) {
            try {
                await this.integrationManager.startIntegration(integration);
                startedIntegrations.push(integration);
                console.log(`✅ ${integration} integration started successfully`);
            } catch (error) {
                console.error(`❌ Failed to start ${integration} integration:`, error);
            }
        }

        if (startedIntegrations.length === 0) {
            console.log('❌ No integrations could be started');
            this.state = 'error';
            return;
        }

        this.state = 'ready';
        console.log(`\n🎉 KremStream Neo is ready! Active integrations: ${startedIntegrations.join(', ')}`);

        const integrationStatus = this.integrationManager.getIntegrationStatus();
        const activeCount = Object.values(integrationStatus).filter(Boolean).length;

        if (activeCount > 1) {
            console.log('📝 Source marking enabled (multiple integrations active)');
        } else {
            console.log('📝 Source marking disabled (single integration active)');
        }
    }

    private getStatusEmoji(status: string): string {
        switch (status) {
            case 'valid': return '✅';
            case 'expired': return '⏰';
            case 'invalid': return '❌';
            case 'missing': return '🔍';
            default: return '❓';
        }
    }

    private async waitForAuthentications(enabledIntegrations: IntegrationName[]): Promise<void> {
        return new Promise((resolve) => {
            const checkAuthStatus = () => {
                if (tokenManager.allIntegrationsReady(enabledIntegrations)) {
                    console.log('✅ All required authentications complete');
                    resolve();
                } else {
                    // Check again in 1 second
                    setTimeout(checkAuthStatus, 1000);
                }
            };

            checkAuthStatus();
        });
    }

    async handleNewAuthentication(integration: IntegrationName): Promise<void> {
        console.log(`🔑 ${integration} authentication received`);

        // Re-check this integration's token state
        const tokenStates = await tokenManager.checkAllTokens([integration]);
        const state = tokenStates[0];

        if (state && state.status === 'valid') {
            console.log(`✅ ${integration} tokens validated`);

            // If we're in the ready state and this is a new integration, start it immediately
            if (this.state === 'ready') {
                try {
                    await this.integrationManager.startIntegration(integration);
                    console.log(`✅ ${integration} integration started successfully`);

                    // Update source marking status
                    const integrationStatus = this.integrationManager.getIntegrationStatus();
                    const activeCount = Object.values(integrationStatus).filter(Boolean).length;

                    if (activeCount > 1) {
                        console.log('📝 Source marking now enabled (multiple integrations active)');
                    }
                } catch (error) {
                    console.error(`❌ Failed to start ${integration} integration:`, error);
                }
            }
        } else {
            console.log(`❌ ${integration} authentication failed or tokens invalid`);
        }
    }

    getState(): StartupState {
        return this.state;
    }

    isReady(): boolean {
        return this.state === 'ready';
    }

    needsAuth(): boolean {
        return this.state === 'needs_auth';
    }

    hasError(): boolean {
        return this.state === 'error';
    }
}
