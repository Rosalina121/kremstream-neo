import { useEffect, useRef, useState } from "react";
import "./App.css";
import followSound from "./sounds/follow.wav";

// import wall_xp from "./wallpapers/xp.jpg"
import wall_sakura from "./wallpapers/sakura.jpg"
import krem_os_logo from "./wallpapers/kremos.png"
import kremówka from "./wallpapers/kremsimsshadow.png"

// icons
import { FaBluetooth, FaVideo, FaVolumeHigh, FaWifi } from "react-icons/fa6";

type Follow = {
  username: string;
  profilePic: string;
};

export default function App() {
  const [latestFollow, setLatestFollow] = useState<Follow | null>(null);
  const [followQueue, setFollowQueue] = useState<Follow[]>([]);
  const followTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const followAudioRef = useRef<HTMLAudioElement>(null);

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.onmessage = (event) => {
      // console.log("Received message:", event.data);
      const msg = JSON.parse(event.data);
      if (msg.type === "follow") {
        setFollowQueue((prev) => [...prev, msg.data]);
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
          {!alert && <div className="w-5 h-5 rounded-4xl bg-cyan-300 flex items-center justify-center shadow">
            {/*<LuMaximize2 className="opacity-45 scale-75" />*/}
          </div>}
          <div className="w-5 h-5 rounded-4xl bg-pink-400 flex items-center justify-center shadow">
            {/*<FaWindowMinimize className="opacity-45 scale-[0.7]" />*/}
          </div>
          <div className="w-5 h-5 rounded-4xl bg-white flex items-center justify-center shadow">
            {/*<IoCloseOutline className="text-2xl opacity-45" />*/}

          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-screen h-screen flex flex-row bg-red-200"
    >
      <audio ref={followAudioRef} src={followSound} />

      {/* borders */}
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <div className="absolute w-full top-0 h-8 flex flex-row items-center px-12 text-slate-700">
          {/* menu */}
          <div className="flex gap-4 grow flex-1">
            <span className="font-bold">Login</span>
            <span>Terminal</span>
            <span>Rozruch</span>
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
        {/* image container */}
        <div className="w-full h-full rounded-3xl overflow-hidden"
          style={{
            boxShadow: 'inset 0px 0px 30px rgba(0, 0, 0, 1)'
          }}
        >
          {/* image */}
          <div className="w-full h-full blur-sm"
            style={{
              backgroundImage: `url(${wall_sakura})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}>

          </div>
        </div>
      </div>

      {/* loading */}
      <div
        className="absolute flex gap-4 flex-col text-slate-700 h-fit w-[30em] top-[50%] right-[50%] translate-x-[50%] -translate-y-[50%]">
        <img src={krem_os_logo} alt="" />
        <div className="h-12 p-2 flex flex-col items-center justify-evenly text-center bg-red-100 rounded-full">
          <div className="relative w-full h-full overflow-hidden rounded-full loading-bar ">
            <div className="absolute inset-0 h-full w-full barber-stripes"></div>
          </div>
        </div>
        <div className="flex flex-col text-xl font-semibold text-white pl-8">
          {/*<span>Ładowanie KremOS</span>*/}
          <span>Ładowanie modułów:</span>
        </div>

      </div>

      {/* alert box */}
      <div
        className="window flex flex-col text-slate-700 h-[20em] w-[30em] top-[50%] right-[50%] translate-x-[50%] -translate-y-[50%]"
        style={{
          display: latestFollow ? "" : "none",
          animation: latestFollow ? "wiggle 1s infinite 0.1s" : ""
        }}>
        {windowDecoration("", "Nowy followek!", true)}
        <div className="h-full flex flex-col items-center justify-evenly py-8 mt-2 mb-1 text-center bg-red-50 rounded-2xl">
          <span className="font-bold text-3xl">Nowy follow!</span>
          <span className="text-2xl"><span className="font-bold">{latestFollow?.username}</span> od teraz obeserwuje transmisję.</span>
        </div>
        <div className="w-full h-fit flex items-center justify-center">
          <div className="bg-red-300 p-2 text-[aliceblue] rounded-3xl w-48 text-center font-bold self-center m-2 shadow ">OK</div>

        </div>
      </div>

      {/* krem clippy */}
      <div className="absolute -right-5 bottom-10">
        <img className="w-[30em]" src={kremówka} alt="" />
      </div>

    </div >
  );
}
