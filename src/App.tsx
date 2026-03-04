import React, { useState, useEffect, useRef } from 'react';
import { calculateStratifiedTankStep, calculateMinutesRemaining } from './models/ValveModel';

const getTempColor = (t: number) => {
  if (t <= 60) return '#3b82f6';
  if (t >= 140) return '#ef4444';
  if (t < 110) {
    const pct = (t - 60) / 50;
    return `rgb(${Math.floor(59 + pct * (14 - 59))}, ${Math.floor(130 + pct * (165 - 130))}, ${Math.floor(246 + pct * (233 - 246))})`;
  } else if (t < 125) {
    const pct = (t - 110) / 15;
    return `rgb(${Math.floor(14 + pct * (249 - 14))}, ${Math.floor(165 + pct * (115 - 165))}, ${Math.floor(233 + pct * (22 - 233))})`;
  } else {
    const pct = (t - 125) / 15;
    return `rgb(${Math.floor(249 + pct * (239 - 249))}, ${Math.floor(115 + pct * (68 - 115))}, ${Math.floor(22 + pct * (68 - 22))})`;
  }
};

const PlumbingDiagram = ({
  preheatLayers, rheem80Layers, flowRate, coldInTemp, preheatCapacity, rheem80Capacity
}: any) => {
  const avgPreheat = preheatLayers.reduce((a: number, b: number) => a + b, 0) / preheatLayers.length;
  const avgRheem = rheem80Layers.reduce((a: number, b: number) => a + b, 0) / rheem80Layers.length;
  const preheatOut = preheatLayers[0];
  const rheemOut = rheem80Layers[0];

  return (
    <div style={{ background: '#18181b', padding: '2rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', marginBottom: '2rem', border: '1px solid #3f3f46' }}>
      <style>{`@keyframes flow { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } } .flow-line { stroke-dasharray: 2 10; animation: flow 1s linear infinite; }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f4f4f5' }}>System Visualization</h3>
      </div>
      <svg viewBox="0 0 700 320" style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Cold water inlet */}
        <path d="M 10 200 L 50 200 L 50 180" fill="none" stroke={getTempColor(coldInTemp)} strokeWidth="4" />
        {flowRate > 0 && <path d="M 10 200 L 50 200 L 50 180" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: `${2/Math.max(flowRate,0.1)}s` }} />}
        <text x="5" y="220" fill={getTempColor(coldInTemp)} fontSize="10" fontWeight="bold">COLD IN</text>
        <text x="5" y="232" fill={getTempColor(coldInTemp)} fontSize="10" fontWeight="bold">{coldInTemp}°F</text>

        {/* HTP GL119 Preheat Tank */}
        <rect x="20" y="80" width="60" height="100" rx="5" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
        {preheatLayers.map((temp: number, i: number) => (
          <rect key={i} x="25" y={85 + (i * 9)} width="50" height="9" fill={getTempColor(temp)} opacity="0.9" />
        ))}
        <text x="50" y="70" textAnchor="middle" fill="#eee" fontSize="9" fontWeight="bold">HTP GL119</text>
        <text x="50" y="60" textAnchor="middle" fill="#a1a1aa" fontSize="8">({preheatCapacity}G Preheat)</text>
        <text x="50" y="98" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ textShadow: '0 0 3px black' }}>{preheatLayers[0].toFixed(0)}°F</text>
        <text x="50" y="170" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ textShadow: '0 0 3px black' }}>{preheatLayers[preheatLayers.length-1].toFixed(0)}°F</text>

        {/* Non-potable heating loop (closed loop around the preheat tank) */}
        {/* Loop path: heat pump → buffer tank → circulator → coil in GL119 → back */}
        <rect x="120" y="260" width="100" height="40" rx="5" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
        <text x="170" y="276" textAnchor="middle" fill="#93c5fd" fontSize="7" fontWeight="bold">Mitsubishi-Trane</text>
        <text x="170" y="288" textAnchor="middle" fill="#93c5fd" fontSize="6">TPWFYP036AU141A</text>

        {/* Buffer tank */}
        <rect x="250" y="265" width="40" height="30" rx="4" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="270" y="283" textAnchor="middle" fill="#a1a1aa" fontSize="7" fontWeight="bold">20G Buf</text>
        <text x="270" y="257" textAnchor="middle" fill="#a1a1aa" fontSize="7">Robin Wood</text>

        {/* Circulator pump */}
        <circle cx="320" cy="280" r="12" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="320" y="283" textAnchor="middle" fill="#a1a1aa" fontSize="6" fontWeight="bold">PUMP</text>
        <text x="320" y="305" textAnchor="middle" fill="#71717a" fontSize="6">Grundfos</text>
        <text x="320" y="314" textAnchor="middle" fill="#71717a" fontSize="6">UP15-29SF</text>

        {/* Non-potable loop piping */}
        <path d="M 220 280 L 250 280" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M 290 280 L 308 280" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 2" />
        {/* Up from pump to tank coil */}
        <path d="M 332 280 L 360 280 L 360 140 L 80 140" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 2" />
        {/* Back from coil down to heat pump */}
        <path d="M 80 130 L 100 130 L 100 280 L 120 280" fill="none" stroke="#4b8cc4" strokeWidth="2" strokeDasharray="4 2" />
        <text x="200" y="250" fill="#60a5fa" fontSize="8" fontWeight="bold">Non-Potable Loop</text>

        {/* Pipe: Preheat tank output → Rheem */}
        <path d={`M 80 130 L 140 130 L 140 100 L 400 100 L 400 180`} fill="none" stroke={getTempColor(preheatOut)} strokeWidth="4" />
        {flowRate > 0 && <path d={`M 80 130 L 140 130 L 140 100 L 400 100 L 400 180`} fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: `${2/Math.max(flowRate,0.1)}s` }} />}
        <text x="270" y="95" textAnchor="middle" fill={getTempColor(preheatOut)} fontSize="9" fontWeight="bold">Pre-heated: {preheatOut.toFixed(0)}°F</text>

        {/* Rheem PROPH80 */}
        <rect x="370" y="80" width="60" height="100" rx="5" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
        {rheem80Layers.map((temp: number, i: number) => (
          <rect key={i} x="375" y={85 + (i * 9)} width="50" height="9" fill={getTempColor(temp)} opacity="0.9" />
        ))}
        <text x="400" y="70" textAnchor="middle" fill="#eee" fontSize="9" fontWeight="bold">Rheem PROPH80</text>
        <text x="400" y="60" textAnchor="middle" fill="#a1a1aa" fontSize="8">({rheem80Capacity}G Heat Pump)</text>
        <text x="400" y="98" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ textShadow: '0 0 3px black' }}>{rheem80Layers[0].toFixed(0)}°F</text>
        <text x="400" y="170" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ textShadow: '0 0 3px black' }}>{rheem80Layers[rheem80Layers.length-1].toFixed(0)}°F</text>

        {/* Output pipe */}
        <path d="M 430 130 L 500 130" fill="none" stroke={getTempColor(rheemOut)} strokeWidth="4" />
        {flowRate > 0 && <path d="M 430 130 L 500 130" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: `${2/Math.max(flowRate,0.1)}s` }} />}
        <rect x="500" y="120" width="14" height="20" fill={getTempColor(rheemOut)} rx="2" />
        <text x="520" y="135" fill={getTempColor(rheemOut)} fontSize="12" fontWeight="bold">{rheemOut.toFixed(1)}°F OUT</text>

        {/* Avg temp labels */}
        <text x="15" y="145" textAnchor="end" fill="#a1a1aa" fontSize="8">AVG</text>
        <text x="15" y="155" textAnchor="end" fill="#a1a1aa" fontSize="8">{avgPreheat.toFixed(0)}°F</text>
        <text x="365" y="145" textAnchor="end" fill="#a1a1aa" fontSize="8">AVG</text>
        <text x="365" y="155" textAnchor="end" fill="#a1a1aa" fontSize="8">{avgRheem.toFixed(0)}°F</text>
      </svg>
    </div>
  );
};

function App() {
  const [preheatTargetTemp, setPreheatTargetTemp] = useState(100);
  const [rheemTargetTemp, setRheemTargetTemp] = useState(135);
  const [flowRate, setFlowRate] = useState(0.5);
  const [coldInTemp, setColdInTemp] = useState(60);
  const [preheatCapacity] = useState(119);
  const [rheem80Capacity] = useState(80);
  const [preheatRecoveryRate, setPreheatRecoveryRate] = useState(20);
  const [rheemRecoveryRate, setRheemRecoveryRate] = useState(25);
  const [simSpeed, setSimSpeed] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [preheatLayers, setPreheatLayers] = useState(new Array(10).fill(100));
  const [rheem80Layers, setRheem80Layers] = useState(new Array(10).fill(135));

  const stateRef = useRef({ preheatLayers, rheem80Layers });
  stateRef.current = { preheatLayers, rheem80Layers };

  useEffect(() => {
    const tickRateMs = 100;
    const timer = setInterval(() => {
      const stepSeconds = (tickRateMs / 1000) * simSpeed;
      setElapsedSeconds(prev => prev + stepSeconds);
      const { preheatLayers: pLayers, rheem80Layers: rLayers } = stateRef.current;

      // Step 1: Cold water enters preheat tank, heated by heat pump loop
      const nextPreheat = calculateStratifiedTankStep(
        pLayers, preheatCapacity, flowRate, coldInTemp,
        preheatRecoveryRate, preheatTargetTemp, stepSeconds
      );
      setPreheatLayers(nextPreheat);

      // Step 2: Preheat output feeds into Rheem 80G (heat pump mode)
      const preheatOutTemp = nextPreheat[0];
      const nextRheem = calculateStratifiedTankStep(
        rLayers, rheem80Capacity, flowRate, preheatOutTemp,
        rheemRecoveryRate, rheemTargetTemp, stepSeconds
      );
      setRheem80Layers(nextRheem);
    }, tickRateMs);
    return () => clearInterval(timer);
  }, [simSpeed, flowRate, preheatCapacity, rheem80Capacity, preheatRecoveryRate, rheemRecoveryRate, preheatTargetTemp, rheemTargetTemp, coldInTemp]);

  const rheemOut = rheem80Layers[0];
  const minutesRemaining = calculateMinutesRemaining(rheem80Layers, rheem80Capacity, flowRate, rheemRecoveryRate, rheemTargetTemp);

  const sliderStyle = { width: '100%', height: '6px', background: '#3f3f46', borderRadius: '5px', outline: 'none', margin: '15px 0' };

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', width: '100%' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem', color: '#fafafa', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <header style={{ marginBottom: '3rem' }}><h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Manor Water Simulator</h1><p style={{ color: '#a1a1aa' }}>Whole-House Thermal Modeling</p></header>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, background: '#18181b', padding: '1rem 1.5rem', borderRadius: '0.75rem', border: '1px solid #3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: '0.875rem', color: '#a1a1aa', fontWeight: 600 }}>SIMULATION CLOCK</span><span style={{ fontFamily: 'monospace', fontSize: '1.5rem', color: '#6366f1', fontWeight: 'bold' }}>{elapsedSeconds.toFixed(0)}s</span></div>
              <div style={{ width: '200px', background: '#18181b', padding: '1rem 1.5rem', borderRadius: '0.75rem', border: '1px solid #3f3f46' }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600, marginBottom: '0.5rem' }}>SPEED: {simSpeed}x</label><input type="range" min="1" max="300" value={simSpeed} onChange={e => setSimSpeed(parseInt(e.target.value))} style={{ width: '100%', margin: 0 }} /></div>
            </div>
            <PlumbingDiagram preheatLayers={preheatLayers} rheem80Layers={rheem80Layers} flowRate={flowRate} coldInTemp={coldInTemp} preheatCapacity={preheatCapacity} rheem80Capacity={rheem80Capacity} />
            <div style={{ background: '#18181b', padding: '2rem', borderRadius: '1rem', border: '1px solid #3f3f46' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Simulation Controls</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Output Demand: <span style={{ color: '#fafafa' }}>{flowRate.toFixed(1)} GPM</span></label><input type="range" min="0" max="20" step="0.1" value={flowRate} onChange={e => setFlowRate(parseFloat(e.target.value))} style={sliderStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Cold Inlet Temp: <span style={{ color: '#fafafa' }}>{coldInTemp}°F</span></label><input type="range" min="35" max="80" value={coldInTemp} onChange={e => setColdInTemp(parseInt(e.target.value))} style={sliderStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Preheat Target (GL119): <span style={{ color: '#fafafa' }}>{preheatTargetTemp}°F</span></label><input type="range" min="70" max="130" value={preheatTargetTemp} onChange={e => setPreheatTargetTemp(parseInt(e.target.value))} style={sliderStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Rheem Target (PROPH80): <span style={{ color: '#fafafa' }}>{rheemTargetTemp}°F</span></label><input type="range" min="100" max="160" value={rheemTargetTemp} onChange={e => setRheemTargetTemp(parseInt(e.target.value))} style={sliderStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Preheat Recovery: <span style={{ color: '#fafafa' }}>{preheatRecoveryRate} GPH</span></label><input type="range" min="5" max="60" value={preheatRecoveryRate} onChange={e => setPreheatRecoveryRate(parseInt(e.target.value))} style={sliderStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Rheem Recovery: <span style={{ color: '#fafafa' }}>{rheemRecoveryRate} GPH</span></label><input type="range" min="5" max="60" value={rheemRecoveryRate} onChange={e => setRheemRecoveryRate(parseInt(e.target.value))} style={sliderStyle} /></div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ background: '#18181b', padding: '2rem', borderRadius: '1rem', border: '1px solid #3f3f46', textAlign: 'center' }}>
              <h3 style={{ marginTop: 0, fontSize: '0.875rem', textTransform: 'uppercase', color: '#a1a1aa' }}>Output Temperature</h3>
              <div style={{ fontSize: '4.5rem', fontWeight: 800, color: getTempColor(rheemOut) }}>{rheemOut.toFixed(1)}°F</div>
              <div style={{ borderTop: '1px solid #27272a', marginTop: '1.5rem', paddingTop: '1.5rem', textAlign: 'left' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}><span style={{ color: '#a1a1aa' }}>Preheat Out</span><span style={{ fontWeight: 600 }}>{preheatLayers[0].toFixed(1)}°F</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}><span style={{ color: '#a1a1aa' }}>Flow Rate</span><span style={{ fontWeight: 600 }}>{flowRate.toFixed(1)} GPM</span></div>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', background: '#27272a', padding: '1.5rem', borderRadius: '1rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#18181b', borderRadius: '0.5rem', border: '1px solid #3f3f46', textAlign: 'center' }}><span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block', marginBottom: '0.25rem' }}>ESTIMATED HOT WATER REMAINING</span><span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: minutesRemaining === Infinity ? '#22c55e' : minutesRemaining < 5 ? '#ef4444' : '#f97316' }}>{minutesRemaining === Infinity ? 'Infinite (Stable)' : `${minutesRemaining.toFixed(1)} Minutes`}</span></div>
              {flowRate <= 0.05 ? (
                <div style={{ marginTop: '1rem', color: '#a1a1aa', border: '1px solid #3f3f46', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <strong>SYSTEM IDLE:</strong> No active demand.
                </div>
              ) : rheemOut >= rheemTargetTemp - 1 ? (
                <div style={{ marginTop: '1rem', color: '#86efac', border: '1px solid #22c55e', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(34, 197, 94, 0.1)' }}>
                  <strong>NORMAL:</strong> Delivering at target temperature.
                </div>
              ) : (
                <div style={{ marginTop: '1rem', color: '#fca5a5', border: '1px solid #ef4444', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.1)' }}>
                  <strong>DEPLETING:</strong> Output below target. Recovery in progress.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
