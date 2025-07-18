import { useEffect, useState } from "react";
import "./App.css"

import { FaBluesky, FaCat, FaGamepad, FaHeartCrack, FaLaptopCode, FaLinux, FaReact, FaSoundcloud } from "react-icons/fa6";
import { GiFamilyHouse, GiFruitTree, GiGrimReaper, GiIsland, GiMushroomCloud } from "react-icons/gi";
import { PiRainbowBold } from "react-icons/pi";
import { SiAffinityphoto, SiGodotengine, SiZedindustries } from "react-icons/si";

import kremImg from './assets/kremsimsshadow.png'
import { FaHeart, FaMoneyCheckAlt, FaTwitch } from "react-icons/fa";
import { IoMdPlanet } from "react-icons/io";
import { BsFillGiftFill, BsNintendoSwitch } from "react-icons/bs";

// At the top level, modify how we store icons - store just the component type instead of the rendered component
const iconComponents = [
  FaGamepad,
  FaBluesky,
  SiGodotengine,
  FaLinux,
  FaCat,
  GiFamilyHouse,
  PiRainbowBold,
  FaLaptopCode,
  FaHeart,
  FaHeartCrack,
  GiFruitTree,
  FaMoneyCheckAlt,
  FaSoundcloud,
  SiAffinityphoto,
  SiZedindustries,
  FaReact,
  GiGrimReaper,
  IoMdPlanet,
  BsNintendoSwitch,
  FaTwitch,
  GiMushroomCloud,
  BsFillGiftFill,
  GiIsland

];

type IconMap = Map<string, typeof FaGamepad>; // or create a union type of all possible icons

export default function App() {

  const [loadingProgress, setLoadingProgress] = useState(0)
  const [clearing, setClearing] = useState(false)

  const [litBoxes, setLitBoxes] = useState(new Map<number, Set<number>>())

  const [iconAssignments, setIconAssignments] = useState<IconMap>(new Map())

  useEffect(() => {
    const newIconAssignments = new Map();

    for (let row = 1; row <= 9; row++) {
      for (let col = 1; col <= 11; col++) {
        const key = `${row}-${col}`;
        const randomIcon = iconComponents[Math.floor(Math.random() * iconComponents.length)];
        newIconAssignments.set(key, randomIcon);
      }
    }

    setIconAssignments(newIconAssignments);
  }, []);

  // Effect to handle progress changes and update lit boxes
  useEffect(() => {
    if (!clearing && loadingProgress > 0) {
      // Only update for the new column
      const newLitBoxes = new Map(litBoxes)
      if (!newLitBoxes.has(loadingProgress)) {
        const numToLight = Math.random() < 0.5 ? 1 : 2
        const availableRows = new Set<number>()

        // Collect available rows for this column (excluding large square area)
        for (let row = 1; row <= 9; row++) {
          if (!(loadingProgress >= 5 && loadingProgress <= 7 &&
            row >= 4 && row <= 6)) {
            availableRows.add(row)
          }
        }

        // Randomly select rows to light
        const selectedRows = new Set<number>()
        for (let i = 0; i < numToLight && availableRows.size > 0; i++) {
          const availableRowsArray = Array.from(availableRows)
          const randomIndex = Math.floor(Math.random() * availableRowsArray.length)
          const selectedRow = availableRowsArray[randomIndex]
          selectedRows.add(selectedRow)
          availableRows.delete(selectedRow)
        }

        newLitBoxes.set(loadingProgress, selectedRows)
        setLitBoxes(newLitBoxes)
      }
    } else if (clearing) {
      // Remove the last column's lit boxes when clearing
      const newLitBoxes = new Map(litBoxes)
      newLitBoxes.delete(loadingProgress + 1)
      console.log("deleting", loadingProgress + 1)
      setLitBoxes(newLitBoxes)
    }
  }, [loadingProgress, clearing])

  const generateGridItems = () => {
    const items = [];
    const largeSquareStart = { col: 5, row: 4 };
    const largeSquareEnd = { col: 7, row: 6 };

    for (let row = 1; row <= 9; row++) {
      for (let col = 1; col <= 11; col++) {
        if (col === largeSquareStart.col && row === largeSquareStart.row) {
          items.push(
            <LargeImageSquare
              key={`large-${row}-${col}`}
            />
          );
        }
        else if (!(col >= largeSquareStart.col && col <= largeSquareEnd.col &&
          row >= largeSquareStart.row && row <= largeSquareEnd.row)) {
          const isLit = litBoxes.get(col)?.has(row) ?? false;
          const key = `${row}-${col}`;
          items.push(
            <ImageSquare
              key={key}
              on={isLit}
              icon={iconAssignments.get(key)}
            />
          );
        }
      }
    }

    return items;
  }

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (clearing) {
      timeout = setTimeout(() => {
        if (loadingProgress > 0) {
          setLoadingProgress(loadingProgress - 1)
        } else {
          setClearing(false)
          setLoadingProgress(0)
        }
      }, 200)
    } else {
      if (loadingProgress == 11) {
        timeout = setTimeout(() => {
          setClearing(true)
        }, 3000)
      } else {
        timeout = setTimeout(() => {
          setLoadingProgress(loadingProgress + 1)
        }, 3000)
      }
    }

    return (() => {
      clearTimeout(timeout)
    })
  }, [loadingProgress, clearing])

  return (
    <>
      <svg style={{ height: 0 }}>
        <defs>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#8ACF33' }} />
            <stop offset="100%" style={{ stopColor: 'yellow' }} />
          </linearGradient>
        </defs>
      </svg>
      <div className="w-screen h-screen flex items-center justify-center relative bg-[#0A3F69]">
        {/* Add a 4:3 viewport container */}
        <div className="aspect-[4/3] h-full relative overflow-hidden shadow-2xl"> {/* 4:3 ratio container */}
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              perspective: "1000px",
            }}>
            <div
              className="absolute aspect-[4/3] w-[161%] bg-gradient-to-t from-[#13346A] to-[#0D6C8C] flex flex-col z-1000"
              style={{
                transformStyle: "preserve-3d",
                transform: `
                  rotateX(35deg)
                  scale(1)
                  translateY(-4.5%)
                `,
                transformOrigin: "center center",
              }}
            >
              <div className="h-12 w-[99%] grid grid-cols-11 justify-items-center my-10 self-center">
                {Array(loadingProgress).fill(null).map((_, i) => (
                  <div
                    key={i}
                    className="w-40 h-12 bg-[#1BE4FA] blur-[2px]"
                  />
                ))}
              </div>
              {/* moved big ass blue drop shadow that is both under the big blue box, and affects the grid items around
               changed to radial gradient since OBs doesn't handle box shadow well in this setup */}
              <div className="absolute -z-10 w-full h-full bg-radial to-transparent from-[#15B9DC] to-65%"></div>

              <div className="items-center justify-items-center justify-center grid grid-cols-11 grid-rows-8 gap-16"
                style={{
                  gridTemplateColumns: 'repeat(11, 144px)', // w-36 = 144px
                  gridTemplateRows: 'repeat(8, 144px)',     // h-36 = 144px
                }}>
                {generateGridItems()}
              </div>
            </div>
          </div>
          <div className="absolute z-10 bottom-0 w-full h-full flex items-center justify-center">
            <img className="w-1/3 mb-20" src={kremImg} alt="" />
          </div>
          <div className="absolute z-10 bottom-0 flex flex-col w-full items-center gap-6 h-96 justify-center bg-gradient-to-t from-[#0A3F69] to-transparent">
            <div className="text-white text-5xl font-bold font-[Comic]">Ładowanie</div>
            <div className="text-white text-8xl font-bold font-[Comic]">Rodzina Kremówka</div>
          </div>

        </div>
      </div>
    </>
  )
}

function ImageSquare({ on = false, icon: Icon }: { on?: boolean, icon?: typeof FaGamepad }) {
  const styleOff = `border-[#3C6D95]`
  const styleOn = `border-[#0A3F69]`
  const styleBgOff = ` bg-[#0A3F69]/70 `
  const styleBgOn = ` bg-[#1296E9]/40 `

  return (
    <div className={`transition-all duration-300 ${on ? styleOn + styleBgOn : styleOff + styleBgOff} w-[10rem] h-[10rem] rounded-2xl border-4  p-1`}>
      <div className={`transition-all duration-300 ${on ? styleOn : styleOff} w-full h-full rounded-[10px] border-4 flex items-center justify-center`}>
        {Icon && <Icon
          className={`w-20 h-20 transition-all duration-300 text-white/80`}
          style={{
            filter: 'drop-shadow(0 0 1px #0A3F69) drop-shadow(0 0 1px #0A3F69)',
            fill: on ? 'url(#iconGradient)' : undefined
          }}
        />}
      </div>
    </div>
  )
}

function LargeImageSquare() {
  return (
    <div
      className="bg-[#1BE4FA] w-full h-full rounded-2xl border-[3px] border-[white] p-4 -z-10"
      style={{
        gridColumn: "5 / span 3", // Start at column 5 and span 3 columns
        gridRow: "4 / span 3",    // Start at row 4 and span 3 rows
        // boxShadow: "inset 0 0 16px 4px white, 0 0 500px 300px #15B9DC"  // big ass blue box shadow that doesnt work in obs well
        boxShadow: "inset 0 0 16px 4px white"
      }}
    >
      <div
        className="w-full h-full rounded-xl border-[3px] border-[white] flex items-center justify-center"
        style={{
          boxShadow: "inset 0 0 16px 8px white"
        }}
      >
      </div>
    </div>
  );
}
