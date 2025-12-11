export function VideoBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://amvbkkbqkzklrcynpwwm.supabase.co/storage/v1/object/public/uploads/9d8f65ef-58ef-47db-be8f-926f26411b39/1765480917966-Moving_Floor_V2_01.mp4"
          type="video/mp4"
        />
      </video>
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Subtle blue/ice tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-800/40" />
    </div>
  );
}
