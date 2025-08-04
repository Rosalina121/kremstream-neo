// FYI for this you need to setup a receiver on VNyan side

let vnyanSocket: WebSocket;

export function initVnyan() {
    vnyanSocket = new WebSocket("ws://192.168.0.102:8000/vnyan"); // your IP here

    vnyanSocket.onopen = () => console.log("Connected to vnyan WebSocket");
    vnyanSocket.onerror = (error: any) => console.error("VNyanWebSocket error:", error);
    vnyanSocket.onmessage = (data: any) => console.log("VNyan message:", data)
}

export function sendToVnyan(message: string) {
    if (vnyanSocket.readyState === WebSocket.OPEN) {
        vnyanSocket.send(message);
        console.log("Sent to vnyan:", message);
    } else {
        console.error("WebSocket is not open.");
    }
}
