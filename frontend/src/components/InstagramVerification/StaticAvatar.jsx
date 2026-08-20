export default function StaticAvatar({ size = 40, hue = 0, initial }) {
  const style = { width: size, height: size };

  if (initial) {
    return (
      <div className="wl-avatar" style={style}>
        <div className="wl-avatar-initial" style={{ fontSize: size * 0.42 }}>
          {initial.slice(0, 1).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="wl-avatar" style={style}>
      <svg viewBox="0 0 40 40" style={{ filter: `hue-rotate(${hue}deg)` }}>
        <rect width="40" height="40" filter="url(#wl-static-filter)" opacity="0.7" />
        <rect width="40" height="40" fill="url(#wl-avatar-gradient)" opacity="0.55" />
      </svg>
    </div>
  );
}

// Small deterministic hash so the same name always gets the same tint,
// without needing any real identity signal.
export function hueFromString(str) {
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 360;
  }
  return hash;
}