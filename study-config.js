export const CONFIG = Object.freeze({
  startingCans: 3,
  drowsyAfterMs: 12000,
  drinkMs: 2200,
  gameSeconds: 24,
  feverScore: 12,
  scorePerCan: 6,
  maxGameReward: 6
});
export const SEATS = Array.from({length:12},(_,id)=>({
  id, x: -6 + id%4*4, z: -5 + Math.floor(id/4)*4.3
}));
export const DEMOS = [
  {id:'demo-1',nick:'시연 학생 · 유자',seat:1,phase:'study',demo:true},
  {id:'demo-2',nick:'시연 학생 · 모모',seat:4,phase:'sleepy',demo:true},
  {id:'demo-3',nick:'시연 학생 · 다온',seat:11,phase:'study',demo:true}
];
