import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EDIEChamberPotencyGraph = () => {
  const V_chamber = 8.0;
  const half_life_new = 5 / Math.log(2);
  const decay_factor_new = Math.pow(0.5, 1 / half_life_new);
  const days_14 = 14;

  const daily_volumes = {
    '95_14': 5.0,
    '75_14': 3.0,
    '50_14': 1.0,
    '25_14': 0.5,
    '0_1': 0.1,
  };

  const ozPerDayToGph = (ozPerDay) => {
    const gallonsPerDay = ozPerDay / 128;
    return (gallonsPerDay / 16).toFixed(4);
  };

  const simulatePotency = (daily_volume, days, start_potency = 100) => {
    let potency = start_potency;
    const potency_values = [potency];
    for (let day = 0; day < days; day++) {
      potency *= decay_factor_new;
      potency = potency * (1 - daily_volume / V_chamber) + (daily_volume * 100) / V_chamber;
      potency_values.push(potency);
    }
    return potency_values;
  };

  const generateData = () => {
    const data = [];
    for (let day = 0; day <= days_14; day++) {
      const dataPoint = { day };
      Object.entries(daily_volumes).forEach(([key, volume]) => {
        dataPoint[`potency_${key}_100`] = simulatePotency(volume, days_14)[day];
        dataPoint[`potency_${key}_0`] = simulatePotency(volume, days_14, 0)[day];
      });
      dataPoint['potency_0_corrected'] = day <= 7 ? 100 - (100 / 7) * day : 0;
      data.push(dataPoint);
    }
    return data;
  };

  const data = generateData();

  const colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#000000'];

  const CustomizedLegend = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', fontSize: '12px', marginTop: '20px' }}>
      {Object.entries(daily_volumes).map(([key, volume], index) => (
        <div key={key} style={{ margin: '0 10px 10px 10px', textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{key.split('_')[0]}% Potency:</div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="10" style={{ marginRight: '5px' }}>
              <line x1="0" y1="5" x2="20" y2="5" stroke={colors[index]} strokeWidth="2" />
            </svg>
            <span>100%, {volume.toFixed(2)} oz/day ({ozPerDayToGph(volume)} gph)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="10" style={{ marginRight: '5px' }}>
              <line x1="0" y1="5" x2="20" y2="5" stroke={colors[index]} strokeWidth="2" strokeDasharray="5,5" />
            </svg>
            <span>0%, {(volume * 2).toFixed(2)} oz/day ({ozPerDayToGph(volume * 2)} gph)</span>
          </div>
        </div>
      ))}
      <div style={{ margin: '0 10px 10px 10px', textAlign: 'left' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>0% Potency (No Injection):</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="10" style={{ marginRight: '5px' }}>
            <line x1="0" y1="5" x2="20" y2="5" stroke="black" strokeWidth="2" />
          </svg>
          <span>100%, 0.00 oz/day (0.0000 gph)</span>
        </div>
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
          <p style={{ margin: 0 }}><strong>Day {label}</strong></p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: 0, color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const Notes = () => (
    <div style={{ fontSize: '12px', marginTop: '20px', textAlign: 'left', padding: '0 20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>Notes:</h3>
      <ol>
        <li>Once potency reaches desired value from 0%, injection changes to standard rate.</li>
        <li>This assumes a perfect world scenario in which the chamber is potent exactly 100% at day 0 and 0% at day 7.</li>
        <li>The formula used for calculating potency changes combines exponential decay and volume displacement:
          <ul>
            <li>Volume displacement: P_new = P_old * (1 - V_in/V_total) + (V_in * 100%) / V_total</li>
            <li>These are combined and applied for each day.</li>
          </ul>
        </li>
      </ol>
    </div>
  );

  return (
    <div style={{ width: '100%', height: 800, fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>EDIE Chamber Potency Change Per Day</h2>
      <ResponsiveContainer width="100%" height="60%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="day" 
            label={{ value: 'Days', position: 'insideBottomRight', offset: -10 }}
            ticks={[0, 2, 4, 6, 8, 10, 12, 14]}
          />
          <YAxis
            label={{ value: 'Potency (%)', angle: -90, position: 'insideLeft', offset: 15 }}
            domain={[0, 100]}
            ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          {Object.keys(daily_volumes).map((key, index) => (
            <React.Fragment key={key}>
              <Line
                type="monotone"
                dataKey={`potency_${key}_100`}
                stroke={colors[index]}
                name={`${key.split('_')[0]}% Potency (100%)`}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey={`potency_${key}_0`}
                stroke={colors[index]}
                strokeDasharray="5 5"
                name={`${key.split('_')[0]}% Potency (0%)`}
                dot={false}
              />
            </React.Fragment>
          ))}
          <Line
            type="monotone"
            dataKey="potency_0_corrected"
            stroke="black"
            name="0% Potency (No Injection)"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <CustomizedLegend />
      <Notes />
    </div>
  );
};

export default EDIEChamberPotencyGraph;