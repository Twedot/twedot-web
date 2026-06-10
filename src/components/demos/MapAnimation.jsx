import { useState, useEffect } from 'react';

const VENDORS = [
  { id: 1, x: 38, y: 42, label: '👟 Shoe Maker',   name: 'Ade Cobblers',   dist: '0.3 km' },
  { id: 2, x: 62, y: 28, label: '🖥 Screen Repair', name: 'TechFix Hub',    dist: '0.8 km' },
  { id: 3, x: 55, y: 65, label: '✂️ Tailor',        name: 'Fabric Kings',   dist: '1.1 km' },
  { id: 4, x: 25, y: 68, label: '🍜 Food Vendor',   name: "Mama's Kitchen", dist: '0.5 km' },
];

export default function MapAnimation() {
  const [selected, setSelected] = useState(null);
  const [pinged, setPinged] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [replied, setReplied] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setPinged(true);
    const t1 = setTimeout(() => setChatOpen(true), 1000);
    const t2 = setTimeout(() => setTyped('Hi! Are you available?'), 1800);
    const t3 = setTimeout(() => setReplied(true), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [selected]);

  const reset = () => { setSelected(null); setPinged(false); setChatOpen(false); setTyped(''); setReplied(false); };

  return (
    <div>
      {/* Map */}
      <div style={{ background: 'linear-gradient(135deg,#1a1330 60%,#2d1f5e)', borderRadius: 16, height: 200, position: 'relative', overflow: 'hidden', border: '1px solid rgba(124,58,237,0.25)' }}>
        {[...Array(6)].map((_,i)=><div key={i} style={{ position:'absolute', left:`${i*20}%`, top:0, bottom:0, borderLeft:'1px solid rgba(124,58,237,0.12)' }}/>)}
        {[...Array(5)].map((_,i)=><div key={i} style={{ position:'absolute', top:`${i*25}%`, left:0, right:0, borderTop:'1px solid rgba(124,58,237,0.12)' }}/>)}
        <div style={{ position:'absolute', left:'30%', top:0, bottom:0, width:3, background:'rgba(124,58,237,0.18)' }}/>
        <div style={{ position:'absolute', top:'55%', left:0, right:0, height:3, background:'rgba(124,58,237,0.18)' }}/>

        {VENDORS.map(v => (
          <div key={v.id} onClick={() => { reset(); setTimeout(() => setSelected(v), 50); }} style={{ position:'absolute', left:`${v.x}%`, top:`${v.y}%`, transform:'translate(-50%,-50%)', cursor:'pointer', zIndex:2 }}>
            <div style={{ background: selected?.id===v.id ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : '#221842', border:`2px solid ${selected?.id===v.id ? '#c4b5fd' : 'rgba(124,58,237,0.5)'}`, borderRadius:10, padding:'3px 7px', fontSize:10, color:'#fff', whiteSpace:'nowrap', transition:'all 0.3s', fontWeight: selected?.id===v.id ? 700 : 400 }}>{v.label}</div>
            <div style={{ width:7, height:7, background: selected?.id===v.id ? '#c4b5fd' : '#7c3aed', borderRadius:'50%', margin:'0 auto', marginTop:2 }}/>
            {selected?.id===v.id && pinged && <div style={{ position:'absolute', top:'50%', left:'50%', width:36, height:36, borderRadius:'50%', border:'2px solid #a78bfa', animation:'ping 1s ease-out infinite', opacity:0, transform:'translate(-50%,-50%)' }}/>}
          </div>
        ))}
        <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)' }}>
          <div style={{ width:12, height:12, borderRadius:'50%', background:'#22c55e', border:'2px solid #fff', boxShadow:'0 0 10px #22c55e' }}/>
        </div>
        <div style={{ position:'absolute', top:8, left:10, color:'#a78bfa', fontSize:10, fontWeight:700 }}>📍 Twedot Map — Nearby</div>
        {!selected && <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', color:'#a78bfa', fontSize:10, background:'rgba(0,0,0,0.5)', borderRadius:6, padding:'3px 10px' }}>Tap a vendor to connect</div>}
      </div>

      {/* Chat popup */}
      {selected && (
        <div style={{ marginTop:10, background:'#1a1330', borderRadius:14, padding:12, animation:'fadeIn 0.4s ease', border:'1px solid rgba(124,58,237,0.2)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>{selected.label} {selected.name}</div>
              <div style={{ color:'#22c55e', fontSize:10 }}>📍 {selected.dist} · Open now</div>
            </div>
            <button onClick={() => setChatOpen(true)} style={{ background:'linear-gradient(135deg,#7c3aed,#a78bfa)', border:'none', borderRadius:8, padding:'5px 12px', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:11 }}>Chat →</button>
          </div>
          {chatOpen && (
            <div style={{ borderTop:'1px solid rgba(124,58,237,0.2)', paddingTop:8, animation:'fadeIn 0.4s ease' }}>
              {typed && <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:6 }}><div style={{ background:'linear-gradient(135deg,#7c3aed,#a78bfa)', borderRadius:'12px 12px 4px 12px', padding:'6px 10px', color:'#fff', fontSize:11 }}>{typed}</div></div>}
              {replied && <div style={{ display:'flex', animation:'fadeIn 0.4s ease' }}><div style={{ background:'#221842', border:'1px solid rgba(124,58,237,0.3)', borderRadius:'12px 12px 12px 4px', padding:'6px 10px', color:'#fff', fontSize:11 }}>Yes! How can I help? 😊</div></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
