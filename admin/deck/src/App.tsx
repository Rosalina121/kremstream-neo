/*
  This is basically a Streamdeck-like interface with buttons that invoke certain server actions
  Some may be propagated to an overlay (like drak mode toggle), some are only server/PC side,
      like toggling a scene in OBS or resetting VNyan
*/

import { useEffect, useRef, useState } from "react";
import "./App.css";

export default function App() {
  const wsRef = useRef<WebSocket | null>(null);
  // mmr
  const [mmr, setMmr] = useState(0);
  const [mmrModalOpen, setMmrModalOpen] = useState(false);

  // load mmr
  useEffect(() => {
    fetch('/api/mmr')
      .then(res => res.json())
      .then(data => setMmr(data.mmr))
      .catch(err => console.error('Error loading MMR:', err));
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://192.168.0.102:3000/ws");
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
  function handlePauseClick() {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("togglePause");
      wsRef.current.send(JSON.stringify({ type: "overlay", data: { subType: "pause" } }));
    }
  }
  function handleVnyanResetClick() {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("vnyan reset pos");
      wsRef.current.send(JSON.stringify({ type: "vnyan", data: { subType: "reset" } }));
    }
  }

  function handleSubmitMmr() {
    setMmrModalOpen(false);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "overlay", data: { subType: "mmr", mmr } }));
    }
  }

  return (
    <div className="flex items-center justify-center w-screen h-screen">
      {/* mmr popup */}
      <div className={`${mmrModalOpen ? 'flex' : 'hidden'} absolute w-full h-full bg-gray-500/20 items-center justify-center`}
        onClick={() => handleSubmitMmr()}>
        <div className="w-1/3 aspect-square rounded-xl bg-white flex flex-col gap-4 items-center justify-center"
          onClick={(e) => e.stopPropagation()}>
          <span className="text-xl font-bold">New MMR:</span>
          <input className="border-sky-200 border-2 text-center text-3xl p-2 rounded-2xl" type="text" value={mmr || ''} onChange={(e) => setMmr(parseInt(e.target.value) || 0)} />
        </div>
      </div>
      <div className="grid-cols-5 grid grid-rows-3 gap-8 grow m-24">
        <div
          className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white cursor-pointer"
          onClick={handleDarkModeClick}
        >
          Dark Mode
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white"
          onClick={handlePauseClick}>
          Pause
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white"
          onClick={handleVnyanResetClick}>
          Reset Pos
        </div>
        <div className="bg-gray-300 aspect-square rounded-3xl flex items-end justify-center p-8 text-4xl font-bold text-shadow-lg text-white"
          onClick={() => {
            setMmrModalOpen(true);
          }}>
          Set MMR
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
