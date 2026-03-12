import { EventEmitter } from "events";

export type ChatMessage = {
    id: string;
    text: string;
    username: string;
    color?: string;
    profilePic: string;
    source: string;
};

export type FollowEvent = {
    username: string;
    profilePic: string;
    source: string;
};

export type MessageDeleteEvent = {
    id: string;
    source: string;
};

export type ChannelPointsEvent = {
    id: string;
    username: string;
    profilePic: string;
    rewardTitle: string;
    rewardId: string;
    rewardCost: number;
    userInput?: string;
    source: string;
};

export type StreamEvent =
    | { type: "chat"; data: ChatMessage }
    | { type: "follow"; data: FollowEvent }
    | { type: "messageDelete"; data: MessageDeleteEvent }
    | { type: "channelPoints"; data: ChannelPointsEvent };

export class EventBus extends EventEmitter {
    publish(event: StreamEvent) {
        this.emit(event.type, event.data);
        this.emit("event", event);
    }

    onChat(handler: (data: ChatMessage) => void) {
        this.on("chat", handler);
    }

    onFollow(handler: (data: FollowEvent) => void) {
        this.on("follow", handler);
    }

    onMessageDelete(handler: (data: MessageDeleteEvent) => void) {
        this.on("messageDelete", handler);
    }

    onChannelPoints(handler: (data: ChannelPointsEvent) => void) {
        this.on("channelPoints", handler);
    }

    onAnyEvent(handler: (event: StreamEvent) => void) {
        this.on("event", handler);
    }
}

export const eventBus = new EventBus();
