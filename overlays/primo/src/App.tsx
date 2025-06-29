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
//
//
//
//

type ChatMsg = {
  text: string;
  username: string;
  color: string;
  profilePic: string;
};

type BarButton = {
  icon: React.ReactNode;
  highlightText: string;
  idx: number;
}

const arrBarButtons: BarButton[] = [
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
  const [barButtons] = useState<BarButton[]>(arrBarButtons);
  const [currentHighlight, setCurrentHighlight] = useState(0);

  const ref = useRef(null);
  const isOverflow = useIsOverflow(ref, (isOverflowCallback: any) => {
    if (isOverflowCallback) {
      setMessages((prev) => prev.slice(1));
    }
  });

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "chat") {
        setMessages((prev) => [...prev, msg.data]);
      }
    };
    return () => ws.close();
  }, []);

  // change highlighted icon every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHighlight((prev) => (prev + 1) % barButtons.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [barButtons]);

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
          <div className={`${currentHighlight === 0 ? 'border-gradient' : 'bg-none'} w-full flex items-center justify-center p-2 rounded-4xl`}>
            <div className="bg-[#EBEBEB] aspect-square w-full rounded-3xl p-2">
              <div className="bg-white aspect-square w-full rounded-2xl shadow-lg">
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-blue-400 flex flex-col grow">
        <div className="w-full aspect-video bg-amber-800">


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
              <span className=''>{isOverflow ? 'Overflow Detected!' : 'Follow'}</span>
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
