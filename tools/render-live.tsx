/**
 * Render the simulator's PlumbingDiagram with LIVE values from Home Assistant
 * and write it as a static SVG for dashboards to embed.
 *
 *   node tools/render-live.cjs [outfile]
 *
 * Build with:  npm run build:renderer
 * Credentials: expects HASS_SERVER + HASS_TOKEN in the environment
 *              (source ~/.config/ha-debug/credentials)
 *
 * Values with no sensor yet (all four flows, gallons dispensed) are blanked to
 * an em dash rather than rendered as a confident 0.0 -- two recirc pumps run
 * 24/7, so "0.0 GPM" would be actively wrong.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlumbingDiagram } from '../src/App';
import * as fs from 'fs';

const SERVER = (process.env.HASS_SERVER || 'http://127.0.0.1:8123').replace(/\/$/, '');
const TOKEN  = process.env.HASS_TOKEN;
const OUT    = process.argv[2] || '/var/www/html/dhw/diagram.svg';

async function state(id: string): Promise<string | null> {
  try {
    const r = await fetch(`${SERVER}/api/states/${id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (!r.ok) return null;
    return (await r.json() as any).state;
  } catch { return null; }
}
const num = async (id: string, fb: number) => {
  const v = await state(id); const f = v === null ? NaN : parseFloat(v);
  return Number.isFinite(f) ? f : fb;
};

// 10-layer gradient between a measured top and bottom (matches the sim's model)
const layers = (top: number, bot: number) =>
  Array.from({ length: 10 }, (_, i) => top + (bot - top) * (i / 9));

(async () => {
  const upper   = await num('sensor.rheem_hpwh_upper_tank_temperature', 120);
  const lower   = await num('sensor.rheem_hpwh_lower_tank_temperature', 110);
  const coldIn  = await num('sensor.door_switches_dhw_cold_inlet', 72);
  const preheat = await num('sensor.door_switches_dhw_tankless_input', coldIn);
  const tkless  = await num('sensor.door_switches_dhw_tankless_output', 138);
  const mixed   = await num('sensor.door_switches_dhw_mixing_valve_output', 125);
  const pumpL   = (await state('switch.recirc_loop_left'))  === 'on';
  const pumpR   = (await state('switch.recirc_loop_right')) === 'on';

  // Derive the valve's shuttle position from the MEASURED mixed temperature so
  // the diagram's mixed readout matches the probe instead of being simulated.
  // tMixed = R*tHot + (1-R)*tCold, with hot=Rinnai and cold=Rheem (as built).
  const tH = tkless, tC = upper;
  let shuttleR = Math.abs(tH - tC) < 0.5 ? 0 : (mixed - tC) / (tH - tC);
  shuttleR = Math.min(1, Math.max(0, shuttleR));

  const props: any = {
    // Rheem has two real thermistors, so its stratification is measured.
    rheem80Layers: layers(upper, lower),
    // Preheat has a single probe on a dead leg -- flat, and only valid while
    // the Rinnai draws. Rendered flat rather than faking a gradient.
    preheatLayers: layers(preheat, preheat),
    coldInTemp: Math.round(coldIn), preheatCapacity: 80, rheem80Capacity: 80,
    tTanklessActual: tkless, tanklessSetpoint: 140, setpoint: 125,
    // Mixing valve pins to its cold port (the Rheem) whenever that is hot
    // enough; leftPortIsHot=false matches the as-built port assignment.
    currentShuttleR: shuttleR,
    leftPortIsHot: false,   // as built: HOT port = Rinnai, COLD port = Rheem
    isTanklessLimited: false,
    flowRate: 0, tankFlow: 0, tanklessFlow: 0, totalFlow: 0, recircFlow: 0,
    upstairsPumpOn: pumpL, mainBsmtPumpOn: pumpR,
    faucetOn: false, gallonsDispensed: 0,
    onToggleUpstairs: () => {}, onToggleMainBsmt: () => {}, onToggleFaucet: () => {},
  };

  let svg = (renderToStaticMarkup(React.createElement(PlumbingDiagram, props))
              .match(/<svg[\s\S]*<\/svg>/) || [''])[0];
  if (!svg) { console.error('no <svg> produced'); process.exit(1); }

  // Blank the un-sensored readouts (see header note).
  svg = svg.replace(/>(-?\d+(?:\.\d+)?)\s*(GPM|gal)</g, '>&#8212; $2<');

  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  svg = svg.replace('</svg>',
    `<text x="598" y="277" text-anchor="end" fill="#52525b" font-size="6">${stamp}</text></svg>`);

  fs.mkdirSync(require('path').dirname(OUT), { recursive: true });
  const tmp = OUT + '.tmp';
  fs.writeFileSync(tmp, svg);        // atomic swap so readers never see a partial file
  fs.renameSync(tmp, OUT);
  console.error(`wrote ${OUT} (${svg.length} bytes)  upper=${upper.toFixed(1)} lower=${lower.toFixed(1)} mixed=${mixed.toFixed(1)}`);
})();
