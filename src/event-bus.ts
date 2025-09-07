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

export type StreamEvent =
    | { type: "chat"; data: ChatMessage }
    | { type: "follow"; data: FollowEvent }
    | { type: "messageDelete"; data: MessageDeleteEvent };

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

    onAnyEvent(handler: (event: StreamEvent) => void) {
        this.on("event", handler);
    }
}

export const eventBus = new EventBus();
