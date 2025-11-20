import React, { useState } from 'react';
import { CardData, GamePhase } from '../types';

interface CentralShapeProps {
  round: number;
  phase: GamePhase;
  onDrop: (cardId: string) => void;
  droppedCard: CardData | null;
  finalImage: string | null;
  onDownload?: (imageUrl: string) => void; // Updated to pass image URL
}

export const CentralShape: React.FC<CentralShapeProps> = ({
  round,
  phase,
  onDrop,
  droppedCard,
  finalImage,
  onDownload,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const masks = Array(6).fill(0);

  const isEndGame = phase === GamePhase.EndGameAnim || phase === GamePhase.FinalReveal;
  const isFinalReveal = phase === GamePhase.FinalReveal;
  const isFloating = isEndGame;

  const handleDragOver = (e: React.DragEvent) => {
    if (phase !== GamePhase.Selection) return;
    e.preventDefault();
    setIsHovered(true);
  };

  const handleDragLeave = () => setIsHovered(false);

  const handleDrop = (e: React.DragEvent) => {
    if (phase !== GamePhase.Selection) return;
    e.preventDefault();
    setIsHovered(false);
    const cardId = e.dataTransfer.getData('cardId');
    if (cardId) onDrop(cardId);
  };

  const displayImage =
    finalImage || 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=1000&auto=format&fit=crop';

  return (
    <div
      className={`relative w-64 h-64 md:w-80 md:h-80 transition-all duration-1000 ${isFloating ? 'entity-float z-50 scale-125' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`w-full h-full rounded-full relative flex items-center justify-center overflow-hidden transition-all duration-500
          ${isHovered ? 'ring-4 ring-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.6)]' : 'ring-2 ring-slate-500 shadow-[0_0_20px_rgba(255,255,255,0.2)]'}
          ${droppedCard ? 'animate-pulse brightness-125' : ''}
          ${isFinalReveal ? 'ring-4 ring-indigo-500 shadow-[0_0_60px_rgba(99,102,241,0.6)]' : ''}
        `}
      >
        <img
          src={displayImage}
          alt="The Entity"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-[2000ms] ${
            isEndGame ? 'blur-0' : 'blur-md grayscale-[50%]'
          }`}
        />

        {!isEndGame && (
          <div className="absolute inset-0 w-full h-full grid grid-cols-3 grid-rows-2">
            {masks.map((_, index) => (
              <div
                key={index}
                className={`bg-slate-800 transition-opacity duration-1000 border border-slate-700/20 ${
                  index < round ? 'opacity-0' : 'opacity-95'
                }`}
              />
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none mix-blend-overlay" />

        {isEndGame && (
          <>
            <div className="absolute inset-0 bg-yellow-500/20 blur-xl animate-pulse mix-blend-screen" />
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-[200%] h-4 bg-gradient-to-r from-yellow-200/0 via-yellow-100/50 to-yellow-200/0"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                  animation: `spin 10s linear infinite ${i % 2 === 0 ? 'reverse' : ''}`,
                }}
              />
            ))}
          </>
        )}

        {phase === GamePhase.Selection && !isEndGame && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">