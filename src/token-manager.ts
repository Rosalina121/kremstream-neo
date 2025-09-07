import type { IntegrationName } from './integration-config';
import { loadTokens, refreshTokens, type Tokens } from './twitch-oauth';
import { loadYoutubeTokens, refreshYoutubeTokens, type YoutubeTokens } from './youtube-oauth';

export type TokenStatus = 'missing' | 'invalid' | 'expired' | 'valid';

export interface TokenState {
    integration: IntegrationName;
    status: TokenStatus;
    needsAuth: boolean;
    tokens: Tokens | YoutubeTokens | null;
}

export class TokenManager {
    private tokenStates = new Map<IntegrationName, TokenState>();

    async checkAllTokens(enabledIntegrations: IntegrationName[]): Promise<TokenState[]> {
        const states: TokenState[] = [];

        for (const integration of enabledIntegrations) {
            const state = await this.checkIntegrationTokens(integration);
            this.tokenStates.set(integration, state);
            states.push(state);
        }

        return states;
    }

    private async checkIntegrationTokens(integration: IntegrationName): Promise<TokenState> {
        const baseState: TokenState = {
            integration,
            status: 'missing',
            needsAuth: true,
            tokens: null
        };

        try {
            let tokens: Tokens | YoutubeTokens | null = null;

            if (integration === 'twitch') {
                tokens = await loadTokens();
            } else if (integration === 'youtube') {
                tokens = await loadYoutubeTokens();
            }

            if (!tokens) {
                return { ...baseState, status: 'missing' };
            }

            const tokenValidation = this.validateToken(tokens);

            if (tokenValidation.isValid) {
                return {
                    ...baseState,
                    status: 'valid',
                    needsAuth: false,
                    tokens
                };
            }

            if (tokenValidation.canRefresh) {
                const refreshedTokens = await this.refreshIntegrationTokens(integration, tokens);
                if (refreshedTokens) {
                    return {
                        ...baseState,
                        status: 'valid',
                        needsAuth: false,
                        tokens: refreshedTokens
                    };
                } else {
                    return {
                        ...baseState,
                        status: 'invalid',
                        needsAuth: true,
                        tokens: null
                    };
                }
            }

            return {
                ...baseState,
                status: tokenValidation.isExpired ? 'expired' : 'invalid',
                needsAuth: true,
                tokens: null
            };

        } catch (error) {
            console.error(`Error checking ${integration} tokens:`, error);
            return { ...baseState, status: 'invalid' };
        }
    }

    private validateToken(tokens: Tokens | YoutubeTokens): {
        isValid: boolean;
        isExpired: boolean;
        canRefresh: boolean;
    } {
        const now = Date.now();
        const expiresAt = tokens.obtained_at + (tokens.expires_in * 1000) - 60_000; // 1 minute buffer
        const isExpired = now >= expiresAt;
        const hasRefreshToken = !!tokens.refresh_token;

        return {
            isValid: !isExpired,
            isExpired,
            canRefresh: isExpired && hasRefreshToken
        };
    }

    private async refreshIntegrationTokens(
        integration: IntegrationName,
        tokens: Tokens | YoutubeTokens
    ): Promise<Tokens | YoutubeTokens | null> {
        try {
            if (integration === 'twitch') {
                return await refreshTokens(tokens as Tokens);
            } else if (integration === 'youtube') {
                return await refreshYoutubeTokens(tokens as YoutubeTokens);
            }
            return null;
        } catch (error) {
            console.error(`Error refreshing ${integration} tokens:`, error);
            return null;
        }
    }

    getTokenState(integration: IntegrationName): TokenState | null {
        return this.tokenStates.get(integration) || null;
    }

    getAllTokenStates(): TokenState[] {
        return Array.from(this.tokenStates.values());
    }

    getIntegrationsNeedingAuth(): IntegrationName[] {
        return this.getAllTokenStates()
            .filter(state => state.needsAuth)
            .map(state => state.integration);
    }

    getReadyIntegrations(): IntegrationName[] {
        return this.getAllTokenStates()
            .filter(state => state.status === 'valid' && !state.needsAuth)
            .map(state => state.integration);
    }

    allIntegrationsReady(enabledIntegrations: IntegrationName[]): boolean {
        const readyIntegrations = this.getReadyIntegrations();
        return enabledIntegrations.every(integration =>
            readyIntegrations.includes(integration)
        );
    }

    hasAnyReady(): boolean {
        return this.getReadyIntegrations().length > 0;
    }

    updateTokenState(integration: IntegrationName, tokens: Tokens | YoutubeTokens) {
        const currentState = this.tokenStates.get(integration);
        if (currentState) {
            this.tokenStates.set(integration, {
                ...currentState,
                status: 'valid',
                needsAuth: false,
                tokens
            });
        }
    }

    generateAuthPrompt(): string[] {
        const needingAuth = this.getIntegrationsNeedingAuth();
        const messages: string[] = [];

        if (needingAuth.length === 0) {
            return ['All integrations are properly authenticated.'];
        }

        messages.push('Authentication required for the following integrations:');

        for (const integration of needingAuth) {
            const url = `http://localhost:3000/auth/${integration}`;
            messages.push(`- ${integration.charAt(0).toUpperCase() + integration.slice(1)}: ${url}`);
        }

        return messages;
    }
}

export const tokenManager = new TokenManager();
