import { useEffect, useRef, useState } from "react";
import "./App.css";
import { useIsOverflow } from "./components/isOverflow";
import followSound from "./sounds/follow.mp3";

import wall_xp from "./wallpapers/xp.jpg"

import ico_file from "./icons/file.png"
import ico_pc from "./icons/pc.png"
import ico_web from "./icons/pcweb.png"
import ico_hl3 from "./icons/hl3.png"

// icons
import { FaBluetooth, FaVideo, FaVolumeHigh, FaWifi } from "react-icons/fa6";
import { SiVlcmediaplayer } from "react-icons/si";
import { IoChatboxEllipses } from "react-icons/io5";

type ChatMsg = {
  id: string;
  text: string;
  username: string;
  color: string;
  profilePic: string;
  source?: string;
};

type Follow = {
  username: string;
  profilePic: string;
};

export default function App() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [latestFollow, setLatestFollow] = useState<Follow | null>(null);
  const [followQueue, setFollowQueue] = useState<Follow[]>([]);
  const followTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const followAudioRef = useRef<HTMLAudioElement>(null);

  const [, setDarkMode] = useState(true); //maybe in future

  const [currentTime, setCurrentTime] = useState('');

  const ref = useRef(null);
  useIsOverflow(ref, (isOverflowCallback: any) => {
    if (isOverflowCallback) {
      // remove oldest message
      // TODO: animations
      setMessages((prev) => prev.slice(1));
    }
  });

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.onmessage = (event) => {
      // console.log("Received message:", event.data);
      const msg = JSON.parse(event.data);
      if (msg.type === "chat") {
        setMessages((prev) => [...prev, msg.data]);
      }
      if (msg.type === "chatDelete") {
        setMessages((prev) => prev.filter((m) => m.id !== msg.data.id));
      }
      if (msg.type === "follow") {
        setFollowQueue((prev) => [...prev, msg.data]);
      }
      if (msg.type === "toggleDarkMode") {
        setDarkMode((prev) => !prev);
      }
    };
    return () => ws.close();
  }, []);

  // follow queue
  useEffect(() => {
    if (!latestFollow && followQueue.length > 0) {
      console.log("Moving up the queue! Queue:", followQueue)
      const next = followQueue[0];
      setFollowQueue((prev) => prev.slice(1));
      setLatestFollow(next);

      if (followAudioRef.current) {
        followAudioRef.current.currentTime = 0;
        followAudioRef.current.play();
      }
      if (followTimeoutRef.current) clearTimeout(followTimeoutRef.current);
      followTimeoutRef.current = setTimeout(() => {
        setLatestFollow(null);
      }, 5000);
    }
  }, [latestFollow, followQueue]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  function windowDecoration(icon?: React.ReactNode, name?: string, alert?: boolean) {
    return (
      <div className="w-full h-8 bg-red-200 relative flex flex-row px-2 text-slate-700">
        {!alert && <div className="grow flex-1">
          <div className="translate-y-1.5">
            {icon}
          </div>

        </div>}
        <div className={`font-bold grow flex-1 flex ${alert ? "justify-start" : "justify-center"} translate-y-0.5`}>{name}</div>
        <div className="flex flex-row gap-2 grow flex-1 justify-end translate-y-1">
          {!alert && <div className="w-5 h-5 rounded-4xl bg-blue-500"></div>}
          <div className="w-5 h-5 rounded-4xl bg-amber-500"></div>
          <div className="w-5 h-5 rounded-4xl bg-purple-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-screen h-screen flex flex-row"
      style={{
        backgroundImage: `url(${wall_xp})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
      <audio ref={followAudioRef} src={followSound} />

      {/* top bar */}
      <div className="flex flex-row items-center w-full h-8 bg-red-200 px-4 text-slate-700"
        style={{
          boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.5)"
        }}>
        {/* menu */}
        <div className="flex gap-4 grow flex-1">
          <span className="font-bold">KremStream</span>
          <span>Plik</span>
          <span>Edytuj</span>
          <span>Widok</span>
          <span>Pomoc</span>

        </div>
        {/* clock */}
        <div className="grow flex-1 flex justify-center font-bold">
          {currentTime}
        </div>
        {/* icons */}
        <div className="grow flex-1 flex justify-end gap-4">
          <FaBluetooth />
          <FaWifi />
          <FaVolumeHigh />
        </div>
      </div>

      {/* video */}
      <div className="h-[50em] top-15 left-8 window">
        {windowDecoration(<SiVlcmediaplayer className="" />, "VLC")}
        <div className="aspect-video h-[48em] bg-[#ff00ff] rounded-2xl"></div>
      </div>

      {/* cam */}
      <div className="h-[24em] bottom-15 right-15 window">
        {windowDecoration(<FaVideo />, "Kamoso")}
        <div className="aspect-square h-full bg-[#ff00ff] rounded-2xl"></div>
      </div>

      {/* chat */}
      <div className="h-[30em] w-[24em] top-24 right-24 window">
        {windowDecoration(<IoChatboxEllipses />, "Yappu-Yappu")}
        <div className="h-[28em] bg-[#E7E783] rounded-2xl overflow-hidden" ref={ref}>
          {messages.map((msg, index) => (
            <div className="flex w-full flex-row gap-1" key={index}
              style={{
                backgroundColor: index % 2 == 0 ? "#FFFF9B" : "#E7E783"
              }}>
              <div className="p-1 w-12">
                <img src={msg.profilePic} alt="" />
              </div>
              <div className="flex flex-col flex-4">
                <span className="font-bold text-xl"
                  style={{
                    color: msg.color
                  }}>
                  {msg.username}
                </span>
                <span className="break-normal text-blue-900" dangerouslySetInnerHTML={{ __html: msg.text }}></span>
              </div>
            </div>
          ))}
        </div>

        {/* todo chat lol */}
      </div>

      {/* alert box */}
      <div
        className="window flex flex-col text-[aliceblue] h-[20em] w-[30em] top-[50%] right-[50%] translate-x-[50%] -translate-y-[50%] bg-red-300"
        style={{
          display: latestFollow ? "" : "none"
        }}>
        {windowDecoration("", "Nowy followek!", true)}
        <div className="h-full flex flex-col items-center justify-evenly py-8 text-center">
          <span className="font-bold text-3xl">Nowy follow!</span>
          <span className="text-2xl"><span className="font-bold">{latestFollow?.username}</span> od teraz obeserwuje transmisję.</span>
        </div>
        <div className="bg-[aliceblue] p-2 text-red-400 rounded-3xl w-48 text-center font-bold self-end m-2">OK</div>
      </div>

      {/* activate kremOS*/}
      <div className="absolute flex flex-col text-white/40 bottom-10 left-10">
        <span className="font-medium text-3xl">Aktywuj KremOS</span>
        <span className="text-xl">Wejdź do ustawień, by aktywować KremOS</span>
      </div>
      
      {/* icons */}
      <div className="absolute bottom-10 left-[50em] flex flex-row gap-10 text-white">
        <div className="flex flex-col items-center w-20 text-center gap-1">
          <img className="h-15 p-1" src={ico_hl3} alt="" />
          <span>hl3beta.exe</span>
        </div>
        <div className="flex flex-col items-center w-20 text-center gap-1">
          <img className="w-15 h-15" src={ico_pc} alt="" />
          <span>Mój Komputer</span>
        </div>
        <div className="flex flex-col items-center w-20 text-center gap-1">
          <img className="w-15 h-15" src={ico_web} alt="" />
          <span>dupa.gay</span>
        </div>
        <div className="flex flex-col items-center w-20 text-center gap-1">
          <img className="w-15 h-15" src={ico_file} alt="" />
          <span>ban_bot.sh</span>
        </div>
      </div>
    </div >
  );
}
