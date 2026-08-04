/**
 * MinimalPlayerTest — bare-minimum Remotion Player to isolate import issues.
 * If this works, the problem is in the SceneBlockPlayer import chain.
 * If this fails, the problem is with @remotion/player itself.
 */
import {useState, useRef} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

// Super simple test composition — no external imports
const TestComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{textAlign: 'center', color: '#fff'}}>
        <h1 style={{fontSize: 72, fontWeight: 800, margin: 0}}>
          🎬 Remotion Player Works!
        </h1>
        <p style={{fontSize: 32, opacity: 0.8, marginTop: 16}}>
          Frame {frame} / 150 @ {fps}fps
        </p>
        <div
          style={{
            width: 400,
            height: 8,
            background: 'rgba(255,255,255,0.3)',
            borderRadius: 4,
            margin: '24px auto 0',
          }}
        >
          <div
            style={{
              width: `${(frame / 150) * 100}%`,
              height: '100%',
              background: '#fff',
              borderRadius: 4,
              transition: 'width 0.05s linear',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default function MinimalPlayerTest() {
  const playerRef = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      <div
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          background: '#000',
        }}
      >
        <Player
          ref={playerRef}
          component={TestComposition}
          inputProps={{}}
          durationInFrames={150}
          fps={30}
          compositionWidth={1920}
          compositionHeight={1080}
          style={{
            width: '100%',
            height: 'auto',
            aspectRatio: '16/9',
          }}
          acknowledgeRemotionLicense
        />
      </div>
      <div style={{display: 'flex', gap: 8}}>
        <button
          type="button"
          onClick={() => playerRef.current?.play()}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#3B82F6',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ▶ Play
        </button>
        <button
          type="button"
          onClick={() => playerRef.current?.pause()}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#EF4444',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ⏸ Pause
        </button>
        <button
          type="button"
          onClick={() => {playerRef.current?.seekTo(0); playerRef.current?.play()}}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            background: '#fff',
            color: '#374151',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          ↻ Restart
        </button>
      </div>
    </div>
  );
}
