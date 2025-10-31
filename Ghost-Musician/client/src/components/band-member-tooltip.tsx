import { useState } from "react";

interface BandMember {
  name: string;
  role: string;
  archetype: string;
}

interface BandMemberTooltipProps {
  member: BandMember;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function BandMemberTooltip({ member, children, position = "top" }: BandMemberTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2"
  };

  const arrowClasses = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800",
    bottom: "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800",
    left: "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800",
    right: "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800"
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-pointer transition-all duration-200 hover:scale-105"
        data-testid={`member-trigger-${member.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {children}
      </div>
      
      {isVisible && (
        <div 
          className={`absolute z-50 ${positionClasses[position]} animate-pulse`}
          data-testid={`member-tooltip-${member.name.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {/* Tooltip Content */}
          <div className="bg-gradient-to-br from-deep-slate via-charcoal to-deep-slate text-white rounded-lg p-4 shadow-2xl border border-sky-glint/40 min-w-[280px] max-w-[320px] backdrop-blur-sm">
            {/* Member Name */}
            <h3 className="font-bold text-lg text-white mb-1" data-testid="tooltip-member-name">
              {member.name}
            </h3>
            
            {/* Member Role */}
            <div className="bg-sky-glint/20 rounded px-3 py-1 mb-3 text-center">
              <p className="text-sky-glint font-medium text-sm" data-testid="tooltip-member-role">
                {member.role}
              </p>
            </div>
            
            {/* Member Archetype */}
            <div className="border-t border-sky-glint/30 pt-3">
              <p className="text-xs text-sky-glint uppercase tracking-wide mb-2">ARCHETYPE</p>
              <p className="text-white-smoke italic text-sm leading-relaxed" data-testid="tooltip-member-archetype">
                {member.archetype}
              </p>
            </div>

            {/* Visual Enhancement */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-electric-blue/30">
              <div className="flex space-x-1">
                {/* Musical note icons */}
                <div className="w-2 h-2 bg-sky-glint rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-sky-glint rounded-full animate-pulse delay-200"></div>
              </div>
              <div className="text-xs text-soft-gray">
                🎵 Band Member
              </div>
            </div>
          </div>
          
          {/* Tooltip Arrow */}
          <div 
            className={`absolute w-0 h-0 border-4 border-sky-glint/60 ${arrowClasses[position]}`}
          ></div>
        </div>
      )}
    </div>
  );
}

export default BandMemberTooltip;