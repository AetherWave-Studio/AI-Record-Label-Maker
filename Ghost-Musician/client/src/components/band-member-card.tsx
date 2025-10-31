import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Music, Heart, Star, GripVertical } from 'lucide-react';
interface BandMember {
  name: string;
  role: string;
  archetype: string;
}

interface BandMemberCardProps {
  member: BandMember;
  index: number;
  totalMembers: number;
  bandGenre: string;
  colorPalette: {
    background: string;
    textPrimary: string;
    highlight: string;
  };
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetIndex: number) => void;
  isDragging?: boolean;
}

export function BandMemberCard({ 
  member, 
  index, 
  totalMembers, 
  bandGenre,
  colorPalette,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false
}: BandMemberCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Dynamic positioning based on member count and index
  const getPositionClasses = () => {
    if (totalMembers === 1) {
      return 'left-1/2 transform -translate-x-1/2';
    } else if (totalMembers === 2) {
      return index === 0 ? 'left-1/4' : 'right-1/4';
    } else if (totalMembers === 3) {
      return index === 0 ? 'left-1/6' : 
             index === 1 ? 'left-1/2 transform -translate-x-1/2' : 
             'right-1/6';
    } else if (totalMembers === 4) {
      return index === 0 ? 'left-[12%]' :
             index === 1 ? 'left-[35%]' :
             index === 2 ? 'right-[35%]' :
             'right-[12%]';
    } else {
      // For 5+ members, arrange in a more complex grid
      const positions = [
        'left-[8%]', 'left-[25%]', 'left-1/2 transform -translate-x-1/2', 
        'right-[25%]', 'right-[8%]', 'left-[16%]'
      ];
      return positions[index] || 'left-1/2 transform -translate-x-1/2';
    }
  };

  // Generate member avatar based on role and archetype
  const getMemberAvatar = () => {
    const roleIcons = {
      vocal: <User className="w-4 h-4" />,
      guitar: <Music className="w-4 h-4" />,
      bass: <Music className="w-4 h-4" />,
      drums: <Heart className="w-4 h-4" />,
      keys: <Star className="w-4 h-4" />,
      synth: <Star className="w-4 h-4" />
    };

    const roleKey = Object.keys(roleIcons).find(key => 
      member.role.toLowerCase().includes(key)
    ) as keyof typeof roleIcons;

    return roleIcons[roleKey] || <User className="w-4 h-4" />;
  };

  // Generate personality-based background
  const getPersonalityColor = () => {
    const personality = member.archetype.toLowerCase();
    if (personality.includes('rebel') || personality.includes('wild')) {
      return 'from-red-500 to-orange-500';
    } else if (personality.includes('cool') || personality.includes('calm')) {
      return 'from-blue-500 to-cyan-500';
    } else if (personality.includes('creative') || personality.includes('artistic')) {
      return 'from-purple-500 to-pink-500';
    } else if (personality.includes('leader') || personality.includes('confident')) {
      return 'from-yellow-500 to-amber-500';
    } else {
      return 'from-green-500 to-emerald-500';
    }
  };

  return (
    <div 
      className={`absolute bottom-2 ${getPositionClasses()} transition-all duration-300 ease-in-out z-10`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`member-card-${index}`}
    >
      {/* Hover tooltip */}
      {isHovered && (
        <Card 
          className="member-tooltip absolute bottom-20 left-1/2 transform -translate-x-1/2 w-72 p-4 shadow-xl border-2 z-50"
          style={{ 
            backgroundColor: colorPalette.background,
            borderColor: colorPalette.highlight,
            color: colorPalette.textPrimary
          }}
          data-testid={`member-tooltip-${index}`}
        >
          {/* Tooltip arrow */}
          <div 
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45"
            style={{ backgroundColor: colorPalette.background, borderColor: colorPalette.highlight }}
          />
          
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center space-x-3">
              <div 
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${getPersonalityColor()} flex items-center justify-center text-white shadow-lg`}
              >
                {getMemberAvatar()}
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: colorPalette.textPrimary }}>
                  {member.name}
                </h3>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: colorPalette.highlight,
                    color: colorPalette.highlight 
                  }}
                >
                  {member.role}
                </Badge>
              </div>
            </div>

            {/* Archetype */}
            <div className="space-y-1">
              <p className="text-sm font-medium" style={{ color: colorPalette.highlight }}>
                Personality
              </p>
              <p className="text-sm" style={{ color: colorPalette.textPrimary }}>
                {member.archetype}
              </p>
            </div>

            {/* Role-specific details */}
            <div className="space-y-1">
              <p className="text-sm font-medium" style={{ color: colorPalette.highlight }}>
                Contribution
              </p>
              <p className="text-xs leading-relaxed" style={{ color: colorPalette.textPrimary }}>
                {getRoleDescription(member.role, member.archetype, bandGenre)}
              </p>
            </div>

            {/* Fun fact or backstory */}
            <div className="space-y-1">
              <p className="text-sm font-medium" style={{ color: colorPalette.highlight }}>
                Background
              </p>
              <p className="text-xs leading-relaxed italic" style={{ color: colorPalette.textPrimary }}>
                {generateMemberBackstory(member, bandGenre)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Member avatar/button */}
      <div 
        className={`w-12 h-12 rounded-full border-2 cursor-pointer transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl ${
          isHovered ? 'scale-125' : 'scale-100'
        }`}
        style={{ 
          backgroundColor: colorPalette.background,
          borderColor: isHovered ? colorPalette.highlight : colorPalette.textPrimary,
          borderWidth: isHovered ? '3px' : '2px',
          color: colorPalette.textPrimary
        }}
        data-testid={`member-avatar-${index}`}
      >
        <div className={`transition-all duration-300 ${isHovered ? 'scale-125' : ''}`}>
          {getMemberAvatar()}
        </div>
      </div>

      {/* Member name label */}
      <div className="text-center mt-1">
        <p 
          className="text-xs font-medium truncate max-w-12"
          style={{ color: colorPalette.textPrimary }}
        >
          {member.name.split(' ')[0]}
        </p>
      </div>
    </div>
  );
}

// Helper function to generate role-specific descriptions
function getRoleDescription(role: string, archetype: string, genre: string): string {
  const roleKey = role.toLowerCase();
  
  if (roleKey.includes('vocal') || roleKey.includes('lead')) {
    return `Delivers the emotional core of ${genre} with powerful stage presence and connects deeply with audiences through authentic vocal expression.`;
  } else if (roleKey.includes('guitar')) {
    return `Crafts the signature sound with intricate riffs and melodies that define the band's musical identity in the ${genre} landscape.`;
  } else if (roleKey.includes('bass')) {
    return `Provides the rhythmic foundation and groove that drives the band's energy, essential to their ${genre} sound.`;
  } else if (roleKey.includes('drum')) {
    return `Sets the pulse and dynamic range, creating the rhythmic backbone that gives life to their ${genre} compositions.`;
  } else if (roleKey.includes('key') || roleKey.includes('synth')) {
    return `Adds atmospheric layers and harmonic depth, enhancing the band's ${genre} sound with creative textures.`;
  } else {
    return `Brings unique creative energy to the band, contributing essential elements that make their ${genre} sound distinctive.`;
  }
}

// Helper function to generate member backstories
function generateMemberBackstory(member: BandMember, genre: string): string {
  const archetypes = member.archetype.toLowerCase();
  const role = member.role.toLowerCase();
  
  if (archetypes.includes('rebel')) {
    return `Started playing music as an act of rebellion, bringing raw authenticity to the ${genre} scene with an uncompromising artistic vision.`;
  } else if (archetypes.includes('creative') || archetypes.includes('artist')) {
    return `A visionary artist who sees music as painting with sound, constantly experimenting to push the boundaries of ${genre}.`;
  } else if (archetypes.includes('leader') || archetypes.includes('confident')) {
    return `Natural born leader who founded the group, with an innate ability to unite different musical personalities into a cohesive ${genre} force.`;
  } else if (archetypes.includes('cool') || archetypes.includes('calm')) {
    return `The stabilizing force who keeps everyone grounded, bringing wisdom and perspective gained from years in the ${genre} underground.`;
  } else if (archetypes.includes('partner') || archetypes.includes('support')) {
    return `Essential collaborator whose chemistry with the other members creates the magic that makes their ${genre} sound so compelling.`;
  } else {
    return `Discovered their passion for ${genre} at an early age, dedicating their life to mastering their craft and creating authentic musical experiences.`;
  }
}