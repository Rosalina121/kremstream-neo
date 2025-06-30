import { useEffect, useRef, useState } from "react";
import "./App.css";
import { useIsOverflow } from "./components/isOverflow";

// icons
import { FaHeart } from "react-icons/fa6";
import { SlSocialSoundcloud } from "react-icons/sl";
import { RiGithubLine } from "react-icons/ri";
import { FiYoutube } from "react-icons/fi";
import { TbGenderTransgender } from "react-icons/tb";
import { LuNewspaper } from "react-icons/lu";

// palette
// background - #EBEBEB
// bar background - #F4F4F4
// message text - #4275C5
// message sender - #3A3A3A
// message bar - #C0C0C0
// text Options - #101010
// text hover - #1666D8
//
// dark mode
// background - #262626
// bar background - #363636
// text - #D0D0D0
// hover text - #24C0EE
// message sender uses text
// message text uses hover text
//
// gradient
// blue - #1A77F5
// light blue - #BEF8FC
// purple - #7A78FC
// pink - #FCCCEB
// purple2 - #E0B7FF
// pink - #FCCCEB
//

const lightPalette = {
  background: "#EBEBEB",
  barBackground: "#F4F4F4",
  messageText: "#4275C5",
  messageSender: "#3A3A3A",
  messageBar: "#C0C0C0",
  textOptions: "#101010",
  textHover: "#1666D8",
};

const darkPalette = {
  background: "#262626",
  barBackground: "#363636",
  messageText: "#24C0EE",
  messageSender: "#D0D0D0",
  messageBar: "#444950",
  textOptions: "#D0D0D0",
  textHover: "#24C0EE",
};

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
    icon: <FiYoutube className="text-5xl text-red-600" />,
    highlightText: "youtube.com/@alina_rosa",
    idx: 1,
  },
  {
    icon: <RiGithubLine className="text-5xl text-gray-500" />,
    highlightText: "github.com/rosalina121",
    idx: 2,
  },
  {
    icon: <SlSocialSoundcloud className="text-[3.25rem] text-orange-500" />,
    highlightText: "soundcloud.com/rosalina121",
    idx: 3,
  },
  {
    icon: <LuNewspaper className="text-5xl text-purple-600" />,
    highlightText: "dupa.gay",
    idx: 4,
  },
  {
    icon: <TbGenderTransgender className="text-5xl text-pink-500" />,
    highlightText: "Human rights",
    idx: 5,
  },

];


export default function App() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [currentHighlight, setCurrentHighlight] = useState(1);
  const [latestFollow, setLatestFollow] = useState<Follow | null>(null);
  const [followQueue, setFollowQueue] = useState<Follow[]>([]);
  const followTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [darkMode, setDarkMode] = useState(true);
  const palette = darkMode ? darkPalette : lightPalette;

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
      if (followTimeoutRef.current) clearTimeout(followTimeoutRef.current);
      followTimeoutRef.current = setTimeout(() => {
        setLatestFollow(null);
      }, 5000);
    }
  }, [latestFollow, followQueue]);

  return (
    <div className="w-screen h-screen flex flex-row" style={{ color: palette.textOptions }}>
      <div className="flex-col flex" style={{ width: 384, height: "100%" }}>
        <div className="h-18 pb-2 pl-[10%] w-full flex items-end"
          style={{ background: palette.background }}>
          <span className="text-2xl" style={{ color: palette.textOptions }}>Kremstream's Chat</span>
        </div>
        <div className="w-full h-0.5 flex justify-center">
          <div style={{ background: palette.background, width: "10%" }}></div>
          <div style={{ background: palette.messageBar, width: "80%" }}></div>
          <div style={{ background: palette.background, width: "10%" }}></div>
        </div>
        {/* messages */}
        <div className="h-[620px] w-full flex flex-col items-center" style={{ background: palette.background }} ref={ref}>
          {messages.map((msg, index) => (
            <div className="flex w-4/5 flex-row p-2 gap-4 border-b-[1px]" style={{ borderColor: palette.messageBar }} key={index}>
              <div className="w-20 flex-1">
                <img src={msg.profilePic} alt="" />
              </div>
              <div className="flex flex-col flex-3">
                <span className="text-2xl" style={{ color: palette.messageSender }}>{msg.username}</span>
                <span className="break-normal" style={{ color: palette.messageText }}>{msg.text}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="w-full h-0.5 flex justify-center">
          <div style={{ background: palette.background, width: "10%" }}></div>
          <div style={{ background: palette.messageBar, width: "80%" }}></div>
          <div style={{ background: palette.background, width: "10%" }}></div>
        </div>
        {/* cam box idk jesus */}
        <div className="w-full flex flex-col aspect-square">
          <div className="h-8 w-full" style={{ background: palette.background }}></div>
          <div className="w-full grow flex">
            <div className="w-8 h-full" style={{ background: palette.background }}></div>
            {/* evil stream cutout fuckery
                beware

                layout is like
                div - shadow ho hide the gap between 2 shadows in child - the fact that this still isnt fixed infuriates me
                  div - shadows to stretch the bacground inside the gradient border, and make rounded corers
                    div - gradient mask path fuckery

            */}
            <div className="w-full grow flex p-1"
              style={{
                boxShadow: `inset 0 0 0 16px ${palette.background}`,
                borderRadius: "16px",
              }}>
              <div className="grow"
                style={{
                  // fake the background behind the icon
                  outline: `20px solid ${palette.background}`,
                  borderRadius: "32px",
                  boxShadow: `inset 0 0 0 16px ${palette.background}, 0 0 0 24px ${palette.background}`,
                }}>
                <div
                  className={`${currentHighlight === 0 ? 'border-gradient' : ""} w-full h-full flex items-center justify-center p-1.5 rounded-4xl`}
                  style={{
                    background: currentHighlight === 0 ? "" : palette.background,
                    position: "relative",
                    WebkitMask: `
                      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" preserveAspectRatio="none"><rect x="8" y="8" width="304" height="304" rx="16" fill="black"/></svg>') 0/100% 100%,
                      linear-gradient(#fff,#fff)
                    `,
                    WebkitMaskComposite: "destination-out",
                    mask: `
                      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" preserveAspectRatio="none"><rect x="8" y="8" width="304" height="304" rx="24" fill="black"/></svg>') 0/100% 100%,
                      linear-gradient(#fff,#fff)
                    `,
                    maskComposite: "exclude",
                    // jesus the depths of stackoverflow i had to rummage through to find this fuck
                  }}
                >
                  {/* Optionally, you can add a border or highlight for the cam box here */}
                </div>
              </div>
            </div>

            <div className="w-8 h-full" style={{ background: palette.background }}></div>
          </div>
          <div className="h-8 w-full" style={{ background: palette.background }}></div>

        </div>
      </div>
      <div className="flex flex-col grow">

        {/* video */}
        <div className="w-full aspect-video  h-[864px]">
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
        <div style={{ background: palette.background }} className="h-[216px] flex flex-col justify-around">
          <div style={{ background: palette.barBackground }} className="flex gap-8 p-4 rounded-full self-center mt-8 shadow-md">
            {barButtons.map((button, index) => (
              <div key={index} className="relative flex flex-col items-center justify-center w-20 h-20">

                <div className="flex items-center justify-center w-full h-full rounded-full"
                  style={{
                    background: `${currentHighlight === button.idx ? 'conic-gradient(from 0deg, #4E79FB 0deg, #C9A5FA 90deg, #FCD2DD 180deg, #256FEE 270deg, #4E79FB 360deg)' : 'none'}`,
                    animation: "highlight-spin 2s linear infinite"
                  }}>

                </div>
                <div className="absolute flex items-center justify-center w-[90%] h-[90%] rounded-full"
                  style={{ background: palette.barBackground }}>
                  {button.icon}
                </div>

                {currentHighlight === button.idx && (
                  <span
                    className="absolute left-1/2 mt-40 text-2xl"
                    style={{
                      transform: "translateX(-50%)",
                      color: palette.textHover,
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
              <span className='' style={{ color: palette.textOptions }}>Follow</span>
            </div>
            <div className='flex flex-row items-center gap-1 justify-evenly'>
              <div style={{
                background: palette.textOptions,
                color: palette.background
              }} className='rounded-full px-2 py-1 text-sm font-bold'>!L</div>
              {"/"}
              <div style={{
                background: palette.textOptions,
                color: palette.background
              }} className='rounded-full px-2 py-1 text-sm font-bold'>!R</div>
              <span className='ml-1' style={{ color: palette.textOptions }}>Move cursor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
