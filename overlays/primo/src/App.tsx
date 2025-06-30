import { useEffect, useRef, useState } from "react";
import { FaHeart, FaYoutube } from "react-icons/fa6";
import "./App.css";
import { useIsOverflow } from "./components/isOverflow";

// palette
// background - #EBEBEB
// bar background - #F4F4F4
// message text - #4275C5
// message sender - #3A3A3A
// message bar - #C0C0C0
// text Options - #101010
// text hover - #1666D8
//
// gradient
// blue - #1A77F5
// light blue - #BEF8FC
// purple - #7A78FC
// pink - #FCCCEB
// purple2 - #E0B7FF
// pink - #FCCCEB
//

type ChatMsg = {
  id: string;
  text: string;
  username: string;
  color: string;
  profilePic: string;
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
    icon: <FaYoutube className="text-5xl" />,
    highlightText: "Youtube",
    idx: 1,
  },
  {
    icon: <FaYoutube className="text-5xl text-red-600" />,
    highlightText: "red yt",
    idx: 2,
  },
];


export default function App() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [currentHighlight, setCurrentHighlight] = useState(0);
  const [latestFollow, setLatestFollow] = useState<Follow | null>(null);
  const [followQueue, setFollowQueue] = useState<Follow[]>([]);
  const followTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    <div className="w-screen h-screen flex flex-row text-[#101010]">
      <div className="bg-[#EBEBEB] w-96 h-full flex-col flex">
        <div className="h-18 pb-2 pl-[10%] w-full flex items-end">
          <span className="text-2xl">Kremstream's Chat</span>
        </div>
        <div className="w-full h-0.5 flex justify-center">
          <div className="bg-[#EBEBEB] w-[10%]"></div>
          <div className="bg-[#C0C0C0] w-4/5"></div>
          <div className="bg-[#EBEBEB] w-[10%]"></div>
        </div>
        <div className="h-[620px] w-4/5 self-center bg-[#EBEBEB]" ref={ref}>
          {messages.map((msg, index) => (
            <div className="flex flex-row p-2 gap-4 border-b-[1px] border-[#C0C0C0]" key={index}>
              <div className="w-20 flex-1">
                <img src={msg.profilePic} alt="" />
              </div>
              <div className="flex flex-col flex-3">
                <span className="text-2xl">{msg.username}</span>
                <span className="break-normal text-[#4275C5]">{msg.text}</span>
              </div>
            </div>
          ))}


        </div>
        <div className="w-full h-0.5 flex justify-center">
          <div className="bg-[#EBEBEB] w-[10%]"></div>
          <div className="bg-[#C0C0C0] w-4/5"></div>
          <div className="bg-[#EBEBEB] w-[10%]"></div>
        </div>
        {/* cam box */}
        <div className="bg-[#EBEBEB] w-full aspect-square flex items-center justify-center p-8">
          <div className={`${currentHighlight === 0 ? 'border-gradient' : 'bg-none'} w-full flex items-center justify-center p-1.5 rounded-4xl`}>
            <div className="bg-[#EBEBEB] aspect-square w-full rounded-3xl p-2">
              <div className="bg-[#ff00ff] aspect-square w-full rounded-2xl shadow-lg">
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-blue-400 flex flex-col grow">

        {/* video */}
        <div className="w-full aspect-video bg-[#ff00ff]">
          {/* follow popup */}
          <div className="bg-black/90 min-w-96 w-fit h-24 flex m-2 rounded-lg"
            style={{ display: latestFollow ? "" : "none" }}>
            <img className="rounded-xl p-2" src={latestFollow?.profilePic} alt="" />
            <div className="flex flex-col justify-center text-2xl gap-2 pr-2">
              <span className="text-white">{latestFollow?.username}</span>
              <span className="text-green-400">● Is now following</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-[#EBEBEB] h-full flex flex-col justify-around">
          <div className="bg-[#F4F4F4] flex gap-8 p-4 rounded-full self-center mt-8 shadow-md">
            {barButtons.map((button, index) => (
              <div key={index} className="relative flex flex-col items-center justify-center w-20 h-20">

                <div className="flex items-center justify-center w-full h-full rounded-full"
                  style={{
                    background: `${currentHighlight === button.idx ? 'conic-gradient(from 0deg, #4E79FB 0deg, #C9A5FA 90deg, #FCD2DD 180deg, #256FEE 270deg, #4E79FB 360deg)' : 'none'}`,
                    animation: "highlight-spin 2s linear infinite"
                  }}>

                </div>
                <div className="absolute flex items-center justify-center w-[90%] h-[90%] rounded-full bg-[#F4F4F4]">
                  {button.icon}
                </div>

                {currentHighlight === button.idx && (
                  <span
                    className="absolute left-1/2 mt-40 text-2xl"
                    style={{
                      transform: "translateX(-50%)",
                      color: "#1666D8",
                      textAlign: "center",
                      lineHeight: 1.1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {button.highlightText}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="w-full flex flex-row text-2xl justify-end px-12 pb-2 gap-12 items-center">
            <div className='flex flex-row items-center gap-2 justify-evenly'>
              <FaHeart className='' />
              <span className=''>Follow</span>
            </div>
            <div className='flex flex-row items-center gap-1 justify-evenly'>
              <div className='bg-[#101010] text-[#EBEBEB] rounded-full px-2 py-1 text-sm font-bold'>!L</div>
              {"/"}
              <div className='bg-[#101010] text-[#EBEBEB] rounded-full px-2 py-1 text-sm font-bold'>!R</div>
              <span className='ml-1'>Move cursor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
