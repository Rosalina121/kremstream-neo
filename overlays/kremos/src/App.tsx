import { useEffect, useRef, useState } from "react";
import "./App.css";
import { useIsOverflow } from "./components/isOverflow";
import followSound from "./sounds/follow.mp3";

import wall_xp from "./wallpapers/xp.jpg"
// icons
import { FaBluetooth, FaHeart, FaTwitch, FaVideo, FaVolumeHigh, FaWifi, FaYoutube } from "react-icons/fa6";
import { SlSocialSoundcloud } from "react-icons/sl";
import { RiBlueskyLine, RiGithubLine } from "react-icons/ri";
import { FiYoutube } from "react-icons/fi";
import { TbGenderTransgender } from "react-icons/tb";
import { LuNewspaper } from "react-icons/lu";
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

type BarButton = {
  icon: React.ReactNode;
  highlightText: string;
  idx: number;
}

const barButtons: BarButton[] = [
  {
    icon: <FiYoutube className="text-5xl text-red-600" />,
    highlightText: "youtube.com/@kremstream",
    idx: 1,
  },
  {
    icon: <RiBlueskyLine className="text-5xl text-blue-500" />,
    highlightText: "bsky.com/profile/dupa.gay",
    idx: 2,
  },
  {
    icon: <RiGithubLine className="text-5xl text-gray-500" />,
    highlightText: "github.com/rosalina121",
    idx: 3,
  },
  {
    icon: <SlSocialSoundcloud className="text-[3.25rem] text-orange-500" />,
    highlightText: "soundcloud.com/rosalina121",
    idx: 4,
  },
  {
    icon: <LuNewspaper className="text-5xl text-purple-600" />,
    highlightText: "dupa.gay",
    idx: 5,
  },
  {
    icon: <TbGenderTransgender className="text-5xl text-pink-500" />,
    highlightText: "Human rights",
    idx: 6,
  },

];


export default function App() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [currentHighlight, setCurrentHighlight] = useState(1);
  const [latestFollow, setLatestFollow] = useState<Follow | null>(null);
  const [followQueue, setFollowQueue] = useState<Follow[]>([]);
  const followTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const followAudioRef = useRef<HTMLAudioElement>(null);

  const [darkMode, setDarkMode] = useState(true); //maybe in future

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
        if (msg.data.text.toUpperCase().includes("!L")) {
          setCurrentHighlight((prev) =>
            prev - 1 < 0 ? barButtons.length : prev - 1
          );  // ternary coz % is a remainder op, not modulo, negative numbers etc. etc.
        }
        if (msg.data.text.toUpperCase().includes("!R")) {
          setCurrentHighlight((prev) => (prev + 1) % (barButtons.length + 1));
        }
        console.log("Current Highlight:", currentHighlight);
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

  function windowDecoration(icon?: React.ReactNode, name?: string) {
    return (
      <div className="w-full h-8 bg-red-300 relative flex flex-row px-2 text-[aliceblue]">
        <div className="grow flex-1">
          <div className="translate-y-1.5">
            {icon}
          </div>
          
        </div>
        <div className="font-bold grow flex-1 flex justify-center">{name}</div>
        <div className="flex flex-row gap-2 grow flex-1 justify-end translate-y-1">
          <div className="w-5 h-5 rounded-4xl bg-blue-200"></div>
          <div className="w-5 h-5 rounded-4xl bg-amber-200"></div>
          <div className="w-5 h-5 rounded-4xl bg-purple-200"></div>
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
      <div className="flex flex-row items-center w-full h-8 bg-red-300 px-4 text-[aliceblue]"
        style={{
          boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.5)"
        }}>
        {/* menu */}
        <div className="flex gap-4 grow flex-1">
          <span className="font-bold">AppNameHere</span>
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Help</span>

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
      <div className="h-[48em] top-15 left-8 window">
        {windowDecoration(<SiVlcmediaplayer className=""/>, "Video")}
        <div className="aspect-video h-full bg-[#00ff00]"></div>
      </div>
      
      {/* cam */}
      <div className="h-[24em] bottom-15 right-15 window">
        {windowDecoration(<FaVideo/>, "Cam")}
        <div className="aspect-square h-full bg-[#00ff00]"></div>
      </div>
      
      {/* chat */}
      <div className="h-[30em] w-[24em] top-24 right-24 window">
        {windowDecoration(<IoChatboxEllipses />, "Chat")}
        <div className="h-full"></div>
        {/* todo chat lol */}
      </div>
      
      {/* activate kremOS*/}
      <div className="absolute flex flex-col text-white/40 bottom-10 left-10">
        <span className="font-medium text-3xl">Aktywuj KremOS</span>
        <span className="text-xl">Wejdź do ustawień, by aktywować KremOS</span>
      </div>
    </div >
  );
}
