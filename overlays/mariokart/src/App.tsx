import { useEffect, useRef, useState } from "react";
import "./App.css";
import { useIsOverflow } from "./components/isOverflow";
import bg from "./template ASSet.png"

type ChatMsg = {
  id: string;
  text: string;
  username: string;
  color: string;
  profilePic: string;
  source?: string;
  isNew?: boolean;
};

type Follow = {
  username: string;
  profilePic: string;
};

const primaryColor = "#383838AA";
const secondaryColor = "#ffffff55";

export default function App() {
  const followMessages = [
    "unika blueshella muchomorkiem",
    "unika piorunka gwiazdką",
    "wyprzedza z draftem",
    "szaleje na Lil' Dumpy",
    "dostaje 3 redshelle na drugim",
    "robi skrót na Whistlestop za pierwszym",
    "odpala Bullet Billa"
  ]
  const getRandomObject = (array: string[]) => {
    const randomObject = array[Math.floor(Math.random() * array.length)];
    return randomObject;
  };

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [latestFollow, setLatestFollow] = useState<Follow | null>();
  const [followQueue, setFollowQueue] = useState<Follow[]>([]);
  const followTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mmr, setMmr] = useState<number>(4600);

  const ref = useRef<HTMLDivElement>(null);

  // Load initial MMR when component mounts
  useEffect(() => {
    fetch('/api/mmr')
      .then(res => res.json())
      .then(data => setMmr(data.mmr))
      .catch(err => console.error('Error loading MMR:', err));
  }, []);

  useIsOverflow(ref as React.RefObject<HTMLDivElement>, (isOverflowCallback) => {
    if (isOverflowCallback) {
      setMessages((prev) => prev.slice(1));
    }
  }, [messages]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.onmessage = (event) => {
      // console.log("Received message:", event.data);
      const msg = JSON.parse(event.data);
      if (msg.type === "chat") {
        setMessages((prev) => [...prev, { ...msg.data, isNew: true }]);
      }
      if (msg.type === "chatDelete") {
        setMessages((prev) => prev.filter((m) => m.id !== msg.data.id));
      }
      if (msg.type === "follow") {
        if (!latestFollow) {
          setLatestFollow(msg.data);
          if (followTimeoutRef.current) clearTimeout(followTimeoutRef.current);
          followTimeoutRef.current = setTimeout(() => {
            setLatestFollow(null);
          }, 5000);
        } else {
          setFollowQueue((prev) => [...prev, msg.data]);
        }
      }
      if (msg.type === "mmr") {
        setMmr(msg.data);
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
      if (followTimeoutRef.current) clearTimeout(followTimeoutRef.current);
      followTimeoutRef.current = setTimeout(() => {
        setLatestFollow(null);
      }, 5000);
    }
  }, [latestFollow, followQueue]);

  return (
    <div className="w-screen h-screen"
      style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* chat */}
      <div ref={ref} className="w-[335px] h-[320px] absolute bottom-32 left-[52px] gap-4 flex flex-col items-center justify-end">
        {/* chat msg */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`h-fit text-white font-bold p-3 rounded-3xl w-full ${msg.isNew ? 'new-message' : ''}`}
            style={{
              backgroundColor: primaryColor,
              border: `solid 3px ${secondaryColor}`,
              outline: `solid 5px ${primaryColor}`,
            }}
            onAnimationEnd={() => {
              if (msg.isNew) {
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isNew: false } : m));
              }
            }}
          >
            <div className="w-full h-fit">
              <img src={msg.profilePic} className="inline-block h-6 -translate-y-0.5 rounded-2xl" alt="" />
              <span className=""
                style={{ color: msg.color }}>
                {" "}{msg.username}:{" "}</span>
              <span className="break-normal" dangerouslySetInnerHTML={{ __html: msg.text }}></span>
            </div>
          </div>
        ))}

      </div>
      {/* follow */}
      <div className={`absolute top-12 right-12 w-96 h-48 text-white font-bold text-xl rounded-4xl p-3`}
        style={{
          backgroundColor: primaryColor,
          border: `solid 3px ${secondaryColor}`,
          outline: `solid 5px ${primaryColor}`,
          display: latestFollow ? "" : "none",
          animation: latestFollow ? "slideIn 0.5s ease-in-out, wiggle 1s infinite 0.1s" : ""
        }}
      >
        <div className="w-full h-full flex flex-col items-center justify-around">
          <div className="w-full h-fit flex flex-row items-center justify-center">
            <img className="rounded-full h-[2lh] mr-2" src={latestFollow?.profilePic} alt="" />
            <span className="text-3xl">{latestFollow?.username}</span>
          </div>
          <span className="flex flex-row items-center justify-center break-words text-center">{getRandomObject(followMessages)}</span>
        </div>
      </div>
      {/* cam */}
      <div className={`absolute bottom-[480px] left-[52px] w-[335px] aspect-square text-white font-bold text-xl rounded-[3.5rem] p-3`}
        style={{
          backgroundColor: primaryColor,
          border: `solid 3px ${secondaryColor}`,
          outline: `solid 5px ${primaryColor}`,
        }}>

      </div>
      {/* MMR */}
      <div
        className={`absolute bottom-[44px] left-[25rem] w-48 h-[66px] text-5xl text-white font-bold p-3 rounded-[22px] flex items-center justify-center`}
        style={{
          backgroundColor: primaryColor,
          border: `solid 3px ${secondaryColor}`,
          outline: `solid 5px ${primaryColor}`,
        }}
      >
        <span className="break-normal"
          style={{ textShadow: "2px 2px 1px black" }}>{mmr}</span>
      </div>
    </div>
  );
}
