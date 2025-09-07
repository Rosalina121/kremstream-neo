import { EventBus } from './event-bus';
import type { ChatMessage, FollowEvent, MessageDeleteEvent } from './event-bus';
import type { BaseIntegration } from './integrations/base-integration';
import TwitchEmoticons from '@mkody/twitch-emoticons';

const { EmoteFetcher, EmoteParser } = TwitchEmoticons;

type WebSocketLike = {
    send: (data: string) => void;
};

export class IntegrationManager {
    private integrations = new Map<string, BaseIntegration>();
    private eventBus: EventBus;
    private wsClients = new Set<WebSocketLike>();
    private emoteFetcher: any;
    private emoteParser: any;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
        this.setupEmoteHandling();
        this.setupEventHandlers();
    }

    private setupEmoteHandling() {
        this.emoteFetcher = new EmoteFetcher(
            process.env.TWITCH_CLIENT_ID,
            process.env.TWITCH_CLIENT_SECRET
        );
        this.emoteParser = new EmoteParser(this.emoteFetcher, {
            template: '<img class="emote" alt="{name}" src="{link}">',
            match: /(\w+)+?/g
        });
    }

    private setupEventHandlers() {
        this.eventBus.onChat((data) => this.handleChatMessage(data));
        this.eventBus.onFollow((data) => this.handleFollowEvent(data));
        this.eventBus.onMessageDelete((data) => this.handleMessageDelete(data));
    }

    registerIntegration(integration: BaseIntegration) {
        this.integrations.set(integration.name, integration);
    }

    async startIntegration(name: string): Promise<void> {
        const integration = this.integrations.get(name);
        if (!integration) {
            throw new Error(`Integration '${name}' not found`);
        }

        if (integration.isActive()) {
            console.log(`Integration '${name}' is already active`);
            return;
        }

        await integration.start();
    }

    async stopIntegration(name: string): Promise<void> {
        const integration = this.integrations.get(name);
        if (!integration) {
            throw new Error(`Integration '${name}' not found`);
        }

        await integration.stop();
    }

    getActiveIntegrations(): BaseIntegration[] {
        return Array.from(this.integrations.values()).filter(integration => integration.isActive());
    }

    private shouldShowSource(): boolean {
        return this.getActiveIntegrations().length > 1;
    }

    addWebSocketClient(ws: WebSocketLike) {
        this.wsClients.add(ws);
    }

    removeWebSocketClient(ws: WebSocketLike) {
        this.wsClients.delete(ws);
    }

    broadcast(message: any) {
        const json = JSON.stringify(message);
        for (const ws of this.wsClients) {
            try {
                ws.send(json);
            } catch (error) {
                console.error('Error sending message to WebSocket client:', error);
                this.wsClients.delete(ws);
            }
        }
    }

    private async handleChatMessage(data: ChatMessage) {
        try {
            await Promise.all([
                this.emoteFetcher.fetchTwitchEmotes(),
                this.emoteFetcher.fetchBTTVEmotes(),
                this.emoteFetcher.fetchSevenTVEmotes(),
                this.emoteFetcher.fetchFFZEmotes(),
            ]);

            const processedMessage = {
                ...data,
                text: this.emoteParser.parse(data.text),
                source: this.shouldShowSource() ? data.source : ""
            };

            const message = {
                type: "chat",
                data: processedMessage
            };

            console.log(processedMessage);
            this.broadcast(message);

            if (processedMessage.text.includes("!pipe")) {
                this.handleEasterEgg();
            }

        } catch (error) {
            console.error('Error processing chat message:', error);

            const fallbackMessage = {
                type: "chat",
                data: {
                    ...data,
                    source: this.shouldShowSource() ? data.source : ""
                }
            };
            this.broadcast(fallbackMessage);
        }
    }

    private handleFollowEvent(data: FollowEvent) {
        const message = {
            type: "follow",
            data: {
                username: data.username,
                profilePic: data.profilePic
            }
        };

        console.log(message);
        this.broadcast(message);
    }

    private handleMessageDelete(data: MessageDeleteEvent) {
        const message = {
            type: "chatDelete",
            data: { id: data.id }
        };

        console.log(message);
        this.broadcast(message);
    }

    private async handleEasterEgg() {
        try {
            const { playPipe } = await import('./eastereggs');
            playPipe();
        } catch (error) {
            console.error('Error playing easter egg:', error);
        }
    }

    async startAllAvailableIntegrations(): Promise<string[]> {
        const started: string[] = [];
        const errors: string[] = [];

        for (const [name, integration] of this.integrations) {
            try {
                await this.startIntegration(name);
                started.push(name);
            } catch (error) {
                console.log(`Could not start ${name} integration:`, (error as Error).message);
                errors.push(name);
            }
        }

        return started;
    }

    async stopAllIntegrations(): Promise<void> {
        const stopPromises = Array.from(this.integrations.values()).map(integration =>
            integration.isActive() ? integration.stop() : Promise.resolve()
        );

        await Promise.all(stopPromises);
    }

    getIntegrationStatus(): Record<string, boolean> {
        const status: Record<string, boolean> = {};
        for (const [name, integration] of this.integrations) {
            status[name] = integration.isActive();
        }
        return status;
    }
}
