import { Calendar } from "lucide-react";

interface NewReleaseCardProps {
  albumTitle: string;
  artistName: string;
  releaseDate: string;
  albumArtUrl?: string;
  onClick?: () => void;
}

export function NewReleaseCard({
  albumTitle,
  artistName,
  releaseDate,
  albumArtUrl,
  onClick,
}: NewReleaseCardProps) {
  return (
    <div
      className="relative w-full max-w-[600px] h-[400px] mx-auto group cursor-pointer"
      onClick={onClick}
    >
      {/* Glass morphism card with cyan/pink gradient border glow */}
      <div
        className="relative h-full bg-gradient-to-br from-charcoal to-black rounded-3xl p-8 border border-white/10 transition-all duration-300 hover:border-sky-glint/50"
        style={{
          boxShadow:
            '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(166, 239, 255, 0.1)',
        }}
      >
        {/* Album art thumbnail - top right */}
        {albumArtUrl && (
          <div className="absolute top-8 right-8 w-32 h-32 rounded-xl overflow-hidden border-2 border-sky-glint/30 shadow-xl">
            <img
              src={albumArtUrl}
              alt={albumTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-4 pr-36">
            <h3 className="font-headline font-bold text-4xl text-white-smoke">
              New
              <br />
              Release
            </h3>

            <div className="space-y-2">
              <h4 className="font-headline font-bold text-3xl text-white-smoke">
                Album:{' '}
                <span className="bg-gradient-to-r from-sky-glint to-electric-neon bg-clip-text text-transparent">
                  {albumTitle}
                </span>
              </h4>

              <p className="text-white-smoke text-lg font-semibold">
                Artist: {artistName}
              </p>

              <div className="flex items-center gap-2 text-soft-gray">
                <Calendar size={16} />
                <span className="text-sm">Release Date: {releaseDate}</span>
              </div>
            </div>
          </div>

          {/* Footer branding */}
          <div className="flex items-center justify-end">
            <span className="font-headline text-sm font-bold bg-gradient-to-r from-aetherwave-pink to-sky-glint bg-clip-text text-transparent">
              AetherWave
            </span>
          </div>
        </div>

        {/* Decorative color tags */}
        <div className="absolute bottom-8 left-8 flex gap-3 text-xs font-mono text-soft-gray">
          <span>#0a0a0a</span>
          <span>#f4f4f4</span>
        </div>
      </div>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: '0 16px 48px rgba(166, 239, 255, 0.2)',
        }}
      />
    </div>
  );
}
