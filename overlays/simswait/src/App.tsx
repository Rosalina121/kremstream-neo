import "./App.css";
import theKrems from "./assets/krems.png"

export default function SimsWaiting() {

  const quips: string[] = [
    "Pieczenie kremówek",
    "Instalowanie OBSa",
    "Modelowanie krawędzi",
    "Kompilacja shaderów",
    "Napełnianie basenów",
    "Ściąganie zadań domowych",
    "Nie chcę darmowych słuchawek",
    "Wymyślanie tego tekstu",
    "Rysowanie czcionek",
    "Farbowanie włosów",
    "Szycie brzdkich swetrów",
    "Zachwycanie się nad żabami",
    "Zamawianie Iced Latte Venti Lorem Ipsum",
    "OK.",
    "Labubu Dubai Chocolate Matcha Latte",
    "Rysowanie na ławkach",
    "Usuwanie drabinki z basenu",
    "Szkalowanie papieża",
    "rosebud;;;",
    "Piracenie bez seedowania",
    "Hałasowanie sąsiadom",
    "Segregowanie śmieci",
    "Używanie Archa btw.",
    "Planowanie crashy",
    "Skalowanie interfejsu",
    "Potykanie się o kable",
    "Wypełnianie lodówek",
    "Łączenie z Twitchem",
    "Improwizowanie muzyki",
    "Sprzedawanie EA saudyjczykom",
    "Demontowanie czujników dymu",
    "Sadzenie kwiatków",
    "Deptanie kwiatków",
    "Debatowanie nad sensem życia"
  ];

  return (
    <div className="h-screen bg-[#1B4880] flex flex-row items-center justify-center">
      <div
        className="h-full aspect-[4/3] bg-[#004494] relative flex flex-col items-center justify-evenly text-[#73ACD6] font-['Comic'] text-4xl"
        style={{
          boxShadow: `
            inset -4px -4px 8px rgba(0, 0, 0, 0.5),
            inset 4px 4px 8px rgba(255, 255, 255, 0.5),
            4px 4px 8px rgba(0, 0, 0, 0.3)
          `,
          border: '4px solid',
          borderColor: 'rgba(255, 255, 255, 0.8) rgba(0, 0, 0, 0.6) rgba(0, 0, 0, 0.6) rgba(180, 180, 180, 0.6)'
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 30%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.15) 100%)'
          }}
        />
        <div className="h-[60%] flex items-center justify-center">
          <img src={theKrems} alt="" />
        </div>
        <span>(c)2000 dupa.gay. Wszystkie prawa osób trans to prawa ludzi.</span>

        <div className="w-full overflow-hidden h-12 relative scrolling-container">
          <div className="scrolling-text">
            {[...quips, ...quips].map((q, i) => (
              <span key={i} className="inline-block px-48">{q}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
