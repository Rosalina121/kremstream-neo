export interface BaseIntegration {
    name: string;
    isActive(): boolean;
    start(): Promise<void>;
    stop(): Promise<void>;
}

export type IntegrationConfig = {
    eventBus: import('../event-bus').EventBus;
};

export abstract class AbstractIntegration implements BaseIntegration {
    abstract name: string;
    protected active = false;
    protected eventBus: import('../event-bus').EventBus;

    constructor(config: IntegrationConfig) {
        this.eventBus = config.eventBus;
    }

    isActive(): boolean {
        return this.active;
    }

    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
}
