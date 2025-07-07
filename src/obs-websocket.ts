type OBSHello = {
    op: 0;
    d: {
        authentication?: {
            challenge: string;
            salt: string;
        };
    };
};

type OBSIdentified = {
    op: 2;
    d: Record<string, unknown>;
};

type OBSRequest = {
    op: 6;
    d: {
        requestType: string;
        requestId: string;
        [key: string]: any;
    };
};

type OBSResponse = {
    op: number;
    d: {
        requestId?: string;
        requestStatus?: { result: boolean; comment?: string };
        [key: string]: any;
    };
};

type PendingRequest = {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
};

export class OBSWebSocket {
    private ws: WebSocket | null = null;
    private reqId = 1;
    private pending: Map<string, PendingRequest> = new Map();
    private authenticated = false;
    private connectPromise: Promise<void> | null = null;

    constructor(private url = "ws://localhost:4455") { }

    /**
     * Connects and authenticates to OBS WebSocket.
     * @param password OBS WebSocket password (set in OBS settings)
     */
    async connect(): Promise<void> {
        if (this.connectPromise) return this.connectPromise;
        this.connectPromise = new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                // Wait for Hello (op: 0)
                this.ws!.onmessage = async (event) => {
                    const msg: OBSResponse = JSON.parse(event.data);
                    const password = Bun.env.OBS_WS_PASSWORD;
                    if (msg.op === 0) {
                        if (msg.d.authentication && password) {
                            try {
                                const auth = await this.computeAuth(password, msg.d.authentication.challenge, msg.d.authentication.salt);
                                const identifyPayload = {
                                    op: 1,
                                    d: {
                                        rpcVersion: 1,
                                        authentication: auth,
                                    },
                                };
                                this.ws!.send(JSON.stringify(identifyPayload));
                            } catch (err) {
                                reject("Failed to compute authentication: " + err);
                                return;
                            }
                        } else {
                            // No authentication required
                            this.authenticated = true;
                            this.ws!.onmessage = (event) => this.handleMessage(event);
                            resolve();
                        }
                    } else if (msg.op === 2) {
                        // Identified
                        this.authenticated = true;
                        this.ws!.onmessage = (event) => this.handleMessage(event);
                        resolve();
                    }
                };
            };

            this.ws.onerror = (err) => {
                reject("WebSocket error: " + err);
            };
            this.ws.onclose = () => {
                this.authenticated = false;
                this.connectPromise = null;
            };
        });
        return this.connectPromise;
    }

    private handleMessage(event: MessageEvent) {
        const msg: OBSResponse = JSON.parse(event.data);
        if (msg.d?.requestId && this.pending.has(msg.d.requestId)) {
            const { resolve, reject } = this.pending.get(msg.d.requestId)!;
            if (msg.d.requestStatus?.result) {
                resolve(msg.d);
            } else {
                reject(msg.d.requestStatus?.comment || "OBS request failed");
            }
            this.pending.delete(msg.d.requestId);
        }
    }

    private async computeAuth(password: string, challenge: string, salt: string): Promise<string> {
        // Step 1: secret = base64(SHA256(password + salt))
        const secretRaw = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(password + salt)
        );
        const secret = Buffer.from(secretRaw).toString("base64");

        // Step 2: auth = base64(SHA256(secret + challenge))
        const authRaw = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(secret + challenge)
        );
        return Buffer.from(authRaw).toString("base64");
    }

    private sendRequest(requestType: string, data: any = {}): Promise<any> {
        if (!this.ws || !this.authenticated) {
            return Promise.reject("WebSocket not connected or not authenticated");
        }
        const requestId = `req_${this.reqId++}`;
        const payload: OBSRequest = {
            op: 6, // Request
            d: {
                requestType,
                requestId,
                requestData: data,
            },
        };
        this.ws.send(JSON.stringify(payload));
        return new Promise((resolve, reject) => {
            this.pending.set(requestId, { resolve, reject });
        });
    }

    setCurrentProgramScene(sceneName: string): Promise<void> {
        return this.sendRequest("SetCurrentProgramScene", { sceneName: sceneName });
    }

    close() {
        this.ws?.close();
        this.ws = null;
        this.authenticated = false;
        this.connectPromise = null;
    }
}
