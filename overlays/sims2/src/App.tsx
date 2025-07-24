import { useEffect, useRef, useState } from "react";
import "./App.css";
import { useIsOverflow } from "./components/isOverflow";

import { GrPauseFill } from "react-icons/gr";

import sims2UI from './assets/sims2hud.png'

type ChatMsg = {
  id: string;
  text: string;
  username: string;
  color: string;
  profilePic: string;
  entering?: boolean;
  source?: string;  // youtube, twitch
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

  const [isPaused, setIsPaused] = useState(false);

  const [currentTime, setCurrentTime] = useState('');

  const [followString, setFollowString] = useState("")
  const followStrings: string[] = [
    "Od teraz Cię obserwuję. Każdy. Twój. Ruch.",
    "Mogę pożyczyć łyżeczkę cukru?",
    "Nie widziałaś może mojej drabinki do basenu?"
  ]

  const ref = useRef(null);
  useIsOverflow(ref, (isOverflowCallback: any) => {
    if (isOverflowCallback) {
      // remove oldest message
      setMessages((prev) => prev.slice(1));
    }
  });

  // messages
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.onmessage = (event) => {
      // console.log("Received message:", event.data);
      const msg = JSON.parse(event.data);
      if (msg.type === "chat") {
        // technically speaking the following ops are not atomic per se,
        // as in, if some message hops in between, the wrong message will be removed from
        // the chat, but it's a 1ms window, so unless you're a top 5 twitch streamer
        // you can consider it atomic enough lol
        setMessages((prev) => [...prev, msg.data]);
        setTimeout(() => {
          msg.data.entering = true;
          setMessages((prev) => [...prev.slice(0, -1), msg.data]);
        }, 1);
      }
      if (msg.type === "chatDelete") {
        setMessages((prev) => prev.filter((m) => m.id !== msg.data.id));
      }
      if (msg.type === "follow") {
        if (!latestFollow) {
          setFollowString(followStrings[Math.floor(Math.random() * followStrings.length)])
          setLatestFollow(msg.data);
          if (followTimeoutRef.current) clearTimeout(followTimeoutRef.current);
          followTimeoutRef.current = setTimeout(() => {
            setLatestFollow(null);
          }, 5000);
        } else {
          setFollowQueue((prev) => [...prev, msg.data]);
        }
      }
      if (msg.type === "togglePause") {
        setIsPaused((prev) => !prev);
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

  // time
  const DAYS_OF_WEEK = [
    'Nd.',
    'Pon.',
    'Wt.',
    'Śr.',
    'Czw.',
    'Pt.',
    'Sob.'
  ];
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dayOfWeek = DAYS_OF_WEEK[now.getDay()];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${dayOfWeek} ${hours}:${minutes}`);
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="flex flex-row overflow-hidden">
      <div className="w-[480px] bg-transparent">
        <div className="flex flex-col h-full">
          {/* Messages Container */}
          <div
            className="flex flex-col h-[500px] overflow-hidden"
          >
            <div
              className='flex flex-col overflow-hidden min-h-8 p-1' ref={ref}
            // ref={containerRef} // Reference to the message container
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col mb-1 transition-all relative duration-200 ease-in-out ${!message.entering ? '-translate-x-full' : 'translate-x-0 opacity-100'}`}
                >
                  {/* Container with relative positioning */}
                  <div className="relative"> {/* Added padding-bottom to accommodate background */}
                    {/* Background - positioned absolute */}
                    <div className='absolute inset-0 flex flex-row items-end'
                      style={{ filter: "drop-shadow(2px 2px 2px #000000dd)" }}>
                      <div className='grow h-8 bg-[#5870B1dd] rounded-l-xl border-l-2 border-y-2 border-[#010E61]'>
                      </div>
                      <div className='flex flex-col w-10'>
                        <div className='flex items-center justify-center h-8 bg-[#5870B1dd] rounded-t-xl border-x-2 border-t-2 border-[#010E61]'>
                          {/* Container for the cross */}
                          <div className="relative w-4 h-4 rotate-45"
                            style={{
                              filter: ` drop-shadow(0px 0px 1px #010E61)
                                              drop-shadow(0px 0px 1px #010E61)
                                              drop-shadow(0px 0px 1px #010E61)
                                              drop-shadow(0px 0px 1px #010E61)`
                            }}
                          >
                            {/* Horizontal line */}
                            <div className="absolute top-1/2 left-0 w-full h-[4px] bg-[#C7D7E4] rounded-full
                              transform -translate-y-1/2"></div>
                            {/* Vertical line */}
                            <div className="absolute left-1/2 top-0 h-full w-[4px] bg-[#C7D7E4] rounded-full
                              transform -translate-x-1/2"></div>
                          </div>
                        </div>
                        <div className='h-8 bg-[#5870B1dd] rounded-br-xl border-b-2 border-r-2 border-[#010E61]'>
                        </div>
                      </div>
                    </div>

                    {/* Content - positioned relative */}
                    <div className="relative z-10 flex flex-row p-4 gap-2">
                      <img
                        src={message.profilePic || "https://test.palitechnika.com/Transgender_Pride_flag.png"}
                        alt=""
                        className="w-14 h-14 self-end rounded-lg"
                        style={{ boxShadow: "0px 0px 7px #000000dd" }}
                      />
                      <div className="text-[#010E61] font-[Comic] w-4/5 bg-[#C7D7E4] rounded-xl border-2 border-[#010E61] p-2 relative"
                        style={{ boxShadow: "2px 2px 6px #000000dd" }}

                      >
                        {/* Speech bubble tail */}
                        <div className="absolute -left-[15px] bottom-3 w-0 h-0
                          border-t-[10px] border-t-transparent
                          border-r-[16px] border-r-[#C7D7E4]
                          border-b-[10px] border-b-transparent
                          z-10" />
                        {/* Border for the tail */}
                        <div className="absolute -left-[18px] bottom-3 w-0 h-0
                          border-t-[10px] border-t-transparent
                          border-r-[16px] border-r-black
                          border-b-[10px] border-b-transparent
                          z-0" />

                        <span className="text-xl font-bold">
                          {message.username}:{" "}
                        </span>
                        <span className='text-xl break-words'
                          dangerouslySetInnerHTML={{ __html: message.text }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
          <img className="absolute bottom-0 w-[682px] h-[654px]" style={{ imageRendering: "pixelated" }} src={sims2UI} alt="" />
          <div className='flex items-center absolute w-36 text-[#010E61] font-[Comic] bottom-[1.2rem] left-[1.375rem] text-xl font-bold overflow-hidden'>
            <div
              // ref={textRef}
              className={`whitespace-nowrap`}
            // ${shouldScroll ? 'scrolling-text' : ''}`}
            >
              {/* uncomment below to set cash, I use this space for audio visualizer for now */}
              {/* <span className="px-4">§ 0</span> */}
              {/* {shouldScroll && <span className="px-4">{song}</span>} */}
            </div>
          </div>
          <div className='flex items-center justify-center absolute w-44 text-[#010E61] font-[Comic] bottom-[3.775rem] left-[24rem] text-xl font-bold'>
            <span className='translate-y-1'>{currentTime}</span>
          </div>
        </div>
      </div>

      {/* Call UI is outside of main tower, as to extend on top of right stream view, like in game */}
      {latestFollow && (
        <div className="absolute text-[#010E61] max-w-96 bg-[#5870B1dd] p-4 rounded-[3rem] border-4 border-[#010E61] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ boxShadow: "2px 2px 6px #000000dd" }}
        >
          <div className='flex flex-col w-full h-full gap-2 items-center'>
            <div className="flex flex-row bg-[#95A6DEdd] border-[3px] border-[#010E61] rounded-[2rem] gap-4 p-4">
              <img
                src={
                  latestFollow?.profilePic ||
                  "https://test.palitechnika.com/Transgender_Pride_flag.png"
                }
                alt=""
                className="w-20 h-20 rounded-xl border-[3px] border-[#010E61]"
              />
              <div className='flex flex-col items-start gap-4 text-wrap'>
                <div className="font-[Comic] flex flex-col items-center">
                  <span className="text-2xl font-bold">
                    {latestFollow?.username || "Obserwujący"}
                  </span>
                </div>
                <div className="font-[Comic] flex flex-col items-center">
                  <span className="text-xl">
                    Cześć! Jestem {latestFollow?.username || "Obserwujący"}. {followString}
                  </span>
                </div>
              </div>
            </div>
            <button className='bg-[#95A6DE] border-[3px] border-[#010E61] text-nowrap text-2xl font-[Comic] w-32 h-12 rounded-xl'>
              <span className='font-normal'>OK</span>
            </button>
          </div>
        </div>
      )}

      {/* Right side background */}
      {/* Change to bg-slate-500 or something, by default transaprent */}
      <div className="bg-transparent h-screen aspect-[4/3]"></div>

      {/* Pause overlay */}
      {isPaused && (
        <div className="absolute top-0 left-0 w-full h-full border-8 border-red-500 rounded-4xl">
          <div className="-translate-x-2 -translate-y-2 w-16 h-16 border-8 border-red-500 rounded-full flex items-center justify-center">
            <GrPauseFill className="text-red-500 text-3xl" />
          </div>
        </div>
      )}
    </div>
  );
}
