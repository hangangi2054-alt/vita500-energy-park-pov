import {CONFIG,STOPS,canBoard,coasterPoint} from './park-config.js';
export function boardRide(p){if(p.paused||['drink','ride'].includes(p.phase)||!canBoard(p))return false;p.phase='ride';p.rideProgress=0;p.awake=true;Object.assign(p,coasterPoint(0));return true}
export function exitRide(p){p.phase='idle';p.rideProgress=0;Object.assign(p,STOPS.coaster);delete p.y}
export function advanceRide(p,dt){if(p.phase!=='ride'||p.paused)return false;p.rideProgress=Math.min(1,p.rideProgress+Math.max(0,dt)/CONFIG.rideSeconds);if(p.rideProgress>=1){exitRide(p);return true}Object.assign(p,coasterPoint(p.rideProgress));return false}
