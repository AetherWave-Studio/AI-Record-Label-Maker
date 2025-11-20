import React, { useState } from 'react';
import { CardData, GamePhase } from '../types';

interface CentralShapeProps {
  round: number; // 0-6
  phase: GamePhase;
  onDrop: (cardId: string) => void;
  droppedCard: CardData | null;
  finalImage: string | null;
  onDownload?: () => void;
}

export const CentralShape: React.FC<CentralShapeProps> = ({ round, phase, onDrop, droppedCard, finalImage, onDownload }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate how much is revealed. Round starts at 0.
  // Round 0 completed -> 1/6 revealed. Round 1 -> 2/6.
  // We use 6 masks (divs) covering the image.
  
  const masks = Array(6).fill(0); 

  const isEndGame = phase === GamePhase.EndGameAnim || phase === GamePhase.FinalReveal;
  const isFinalReveal = phase === GamePhase.FinalReveal;
  const isFloating = isEndGame;

  const handleDragOver = (e: React.DragEvent) => {
    if (phase !== GamePhase.Selection) return;
    e.preventDefault();
    setIsHovered(true);
  };

  const handleDragLeave = () => {
    setIsHovered(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (phase !== GamePhase.Selection) return;
    e.preventDefault();
    setIsHovered(false);
    
    const cardId = e.dataTransfer.getData("cardId");
    if (cardId) {
      onDrop(cardId);
    }
  };

  // Placeholder for initial blurred state, final generated image for reveal
  const displayImage = finalImage || "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=1000&auto=format&fit=crop";

  return (
    <div 
      className={`relative w-64 h-64 md:w-80 md:h-80 transition-all duration-1000 
        ${isFloating ? 'entity-float z-50 scale-125' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* The Shape Container */}
      <div className={`w-full h-full rounded-full relative flex items-center justify-center overflow-hidden transition-all duration-500
        ${isHovered ? 'ring-4 ring-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.6)]' : 'ring-2 ring-slate-500 shadow-[0_0_20px_rgba(255,255,255,0.2)]'}
        ${droppedCard ? 'animate-pulse brightness-125' : ''}
        ${isFinalReveal ? 'ring-4 ring-indigo-500 shadow-[0_0_60px_rgba(99,102,241,0.6)]' : ''}
      `}>
        
        {/* The Underlying Image (Initially blurred) */}
        <img 
          src={displayImage} 
          alt="The Entity"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-[2000ms]
            ${isEndGame ? 'blur-0' : 'blur-md grayscale-[50%]'}
          `}
        />

        {/* The "Grey Covering" Masks */}
        {!isEndGame && (
           <div className="absolute inset-0 w-full h-full grid grid-cols-3 grid-rows-2">
             {masks.map((_, index) => (
               <div 
                key={index}
                className={`bg-slate-800 transition-opacity duration-1000 border border-slate-700/20
                  ${index < round ? 'opacity-0' : 'opacity-95'}
                `}
               />
             ))}
           </div>
        )}

        {/* Faint glowing core when empty/masked */}
        <div className={`absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none mix-blend-overlay`} />

        {/* Golden Rays (Only active in EndGame) */}
        {isEndGame && (
          <>
            <div className="absolute inset-0 bg-yellow-500/20 blur-xl animate-pulse mix-blend-screen"></div>
             {/* Ray Beams */}
             {[...Array(8)].map((_, i) => (
                <div key={i} 
                  className="absolute top-1/2 left-1/2 w-[200%] h-4 bg-gradient-to-r from-yellow-200/0 via-yellow-100/50 to-yellow-200/0"
                  style={{ 
                    transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                    animation: `spin 10s linear infinite ${i % 2 === 0 ? 'reverse' : ''}`
                  }}
                />
             ))}
          </>
        )}

        {/* Drop Target Hint */}
        {phase === GamePhase.Selection && !isEndGame && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 border-4 border-dashed border-white/30 rounded-full animate-spin-slow"></div>
            <span className="absolute text-white/50 font-bold text-xs tracking-widest uppercase animate-pulse">Feed Me</span>
          </div>
        )}

        {/* Download Button Overlay */}
        {isFinalReveal && onDownload && (
           <div className="absolute bottom-6 left-0 right-0 flex justify-center z-[60] animate-fade-in-up">
              <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                }}
                className="group flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-indigo-600 backdrop-blur-md rounded-full border border-white/20 transition-all duration-300 shadow-lg hover:scale-105 cursor-pointer"
                title="Download Band Profile"
              >
                <span className="text-white font-cinzel text-sm font-bold">Save Profile</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
           </div>
        )}

      </div>
    </div>
  );
};