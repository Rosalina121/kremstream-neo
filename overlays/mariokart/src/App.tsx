import { useEffect, useRef, useState } from "react";
import "./App.css";
import { useIsOverflow } from "./components/isOverflow";
import backgroundImage from "./template ASSet.png";



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

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "1",
      username: "Rosalina",
      text: "Hello, world! Aaaaaaaa dobra już jakoś wygląda",
      color: "red",
      profilePic: "https://test.palitechnika.com/Transgender_Pride_flag.png",
    },
    {
      id: "2",
      username: "Rosalina",
      text: "Hello, world!",
      color: "red",
      profilePic: "https://test.palitechnika.com/Transgender_Pride_flag.png",
    }
  ]);
  const [latestFollow, setLatestFollow] = useState<Follow | null>();
  const [followQueue, setFollowQueue] = useState<Follow[]>([]);
  const followTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const ref = useRef<HTMLDivElement>(null);

  useIsOverflow(ref as React.RefObject<HTMLDivElement>, (isOverflowCallback) => {
    if (isOverflowCallback) {
      setMessages((prev) => prev.slice(1));
    }
  }, [messages]);

  useEffect(() => {
    console.log("img", backgroundImage)
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
      style={{
        backgroundImage: `url(${backgroundImage})`
      }}>
      {/* chat */}
      <div ref={ref} className="w-[335px] h-[320px] absolute bottom-32 left-[52px] gap-4 flex flex-col items-center justify-end">
        {/* chat msg */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`bg-[#404846DD] h-fit text-white font-bold p-3 rounded-3xl w-full ${msg.isNew ? 'new-message' : ''}`}
            style={{
              border: 'solid 3px #ffffff22',
              outline: 'solid 5px #404846DD',
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
      <div className="absolute top-12 right-12 w-96 h-48 bg-[#404846DD] text-white font-bold text-xl rounded-4xl p-3"
        style={{
          border: 'solid 3px #ffffff22',
          outline: 'solid 5px #404846DD',
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
      <div className="absolute bottom-[480px] left-[52px] w-[335px] aspect-square bg-[#404846DD] text-white font-bold text-xl rounded-[3.5rem] p-3"
        style={{
          border: 'solid 3px #ffffff22',
          outline: 'solid 5px #404846DD',
        }}>

      </div>
    </div>
  );
}
