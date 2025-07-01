/*
  This is basically a Streamdeck-like interface with buttons that invoke certain server actions
  Some may be propagated to an overlay (like drak mode toggle), some are only server/PC side,
      like toggling a scene in OBS or resetting VNyan
*/

import { useEffect, useRef } from "react";
import "./App.css";

export default function App() {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    wsRef.current = ws;
    return () => {
      ws.close();
    };
  }, []);

  function handleDarkModeClick() {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("toggleDarkMode");
      wsRef.current.send(JSON.stringify({ type: "overlay", data: { subType: "darkMode" } }));
    }
  }

  return (
    <div className="flex items-center justify-center w-screen h-screen">
      <div className="grid-cols-5 grid grid-rows-3 gap-8 grow m-24">
        <div
          className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white cursor-pointer"
          onClick={handleDarkModeClick}
        >
          Dark Mode
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>

        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>

        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white">
          Dupa
        </div>
      </div>
    </div>
  );
}
