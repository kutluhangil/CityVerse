import React from 'react';
import { Search } from 'lucide-react';
import { BuildingType } from '../types';

export const IsoIcon: React.FC<{ type: BuildingType; isDemolish: boolean }> = ({
  type,
  isDemolish,
}) => {
  if (isDemolish) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="15,44 50,26 85,44 50,62" fill="#f1f0ec" stroke="#141413" strokeWidth="2.5" />
        <polygon points="15,44 50,62 50,84 15,66" fill="#e1e1df" stroke="#141413" strokeWidth="2.5" />
        <polygon points="50,62 85,44 85,66 50,84" fill="#d5d1c6" stroke="#141413" strokeWidth="2.5" />
        <path d="M 32,36 L 68,68 M 68,36 L 32,68" stroke="#c44536" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === BuildingType.Inspect) {
    return <Search size={22} strokeWidth={2.2} className="text-ink transition-transform group-hover:scale-105" />;
  }
  if (type === BuildingType.Road) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="12,52 50,32 88,52 50,72" fill="#52514e" stroke="#141413" strokeWidth="2.5" />
        <polygon points="12,52 50,72 50,80 12,60" fill="#3d3c39" stroke="#141413" strokeWidth="2.5" />
        <polygon points="50,72 88,52 88,60 50,80" fill="#292826" stroke="#141413" strokeWidth="2.5" />
        <line x1="30" y1="42" x2="70" y2="62" stroke="#faf9f5" strokeWidth="2.5" strokeDasharray="5 5" />
      </svg>
    );
  }
  if (type === BuildingType.Upgrade) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="14,48 50,30 86,48 50,66" fill="#ebc9b7" stroke="#141413" strokeWidth="2.5" />
        <polygon points="14,48 50,66 50,84 14,66" fill="#d97757" stroke="#141413" strokeWidth="2.5" />
        <polygon points="50,66 86,48 86,66 50,84" fill="#b5573a" stroke="#141413" strokeWidth="2.5" />
        <path d="M 50,72 L 50,36 M 38,48 L 50,34 L 62,48" stroke="#141413" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === BuildingType.Residential) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="20,54 50,70 50,88 20,72" fill="#f9f9f7" stroke="#141413" strokeWidth="2.5" />
        <polygon points="50,70 80,54 80,72 50,88" fill="#e1e1df" stroke="#141413" strokeWidth="2.5" />
        <polygon points="14,50 50,28 50,68" fill="#d97757" stroke="#141413" strokeWidth="2.5" />
        <polygon points="50,68 50,28 86,50" fill="#b5573a" stroke="#141413" strokeWidth="2.5" />
      </svg>
    );
  }
  if (type === BuildingType.Commercial) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="14,44 50,62 50,86 14,68" fill="#f1f0ec" stroke="#141413" strokeWidth="2.5" />
        <polygon points="50,62 86,44 86,68 50,86" fill="#d5d1c6" stroke="#141413" strokeWidth="2.5" />
        <polygon points="14,44 50,26 86,44 50,62" fill="#ffffff" stroke="#141413" strokeWidth="2.5" />
        <polygon points="22,52 44,63 44,74 22,63" fill="#d97757" stroke="#141413" strokeWidth="1.8" />
        <polygon points="56,63 78,52 78,63 56,74" fill="#52514e" stroke="#141413" strokeWidth="1.8" />
      </svg>
    );
  }
  if (type === BuildingType.Industrial) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="14,48 50,66 50,86 14,68" fill="#e1e1df" stroke="#141413" strokeWidth="2.5" />
        <polygon points="50,66 86,48 86,68 50,86" fill="#c7c4ba" stroke="#141413" strokeWidth="2.5" />
        <polygon points="14,48 50,30 86,48 50,66" fill="#f1f0ec" stroke="#141413" strokeWidth="2.5" />
        <rect x="34" y="14" width="12" height="28" fill="#52514e" stroke="#141413" strokeWidth="2.2" />
        <rect x="56" y="18" width="12" height="26" fill="#3d3c39" stroke="#141413" strokeWidth="2.2" />
        <circle cx="42" cy="9" r="4" fill="#ffffff" stroke="#141413" strokeWidth="1.5" />
      </svg>
    );
  }
  if (type === BuildingType.Park) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="14,56 50,38 86,56 50,74" fill="#dce6d8" stroke="#141413" strokeWidth="2.5" />
        <polygon points="50,16 34,48 66,48" fill="#6f9172" stroke="#141413" strokeWidth="2.5" />
        <line x1="50" y1="48" x2="50" y2="58" stroke="#141413" strokeWidth="3" />
      </svg>
    );
  }
  if (type === BuildingType.ParkPlayground) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="14,56 50,38 86,56 50,74" fill="#dce6d8" stroke="#141413" strokeWidth="2.5" />
        <path d="M 32,56 L 44,26 L 56,56" fill="none" stroke="#141413" strokeWidth="3" strokeLinejoin="round" />
        <rect x="56" y="34" width="12" height="20" fill="#d97757" stroke="#141413" strokeWidth="2" />
      </svg>
    );
  }
  if (type === BuildingType.ParkFountain) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="14,56 50,38 86,56 50,74" fill="#dce6d8" stroke="#141413" strokeWidth="2.5" />
        <ellipse cx="50" cy="52" rx="18" ry="9" fill="#8ea4b2" stroke="#141413" strokeWidth="2.2" />
        <path d="M 50,50 L 50,24 M 42,36 Q 50,26 58,36" fill="none" stroke="#d97757" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === BuildingType.PowerPlant) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="16,52 46,66 46,84 16,70" fill="#e1e1df" stroke="#141413" strokeWidth="2.5" />
        <polygon points="46,66 76,52 76,70 46,84" fill="#c7c4ba" stroke="#141413" strokeWidth="2.5" />
        <polygon points="16,52 46,38 76,52 46,66" fill="#f1f0ec" stroke="#141413" strokeWidth="2.5" />
        <path d="M 50,18 L 40,36 L 49,36 L 43,52 L 58,32 L 49,32 Z" fill="#d97757" stroke="#141413" strokeWidth="2" />
      </svg>
    );
  }
  if (type === BuildingType.FireStation) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="16,50 50,68 50,86 16,68" fill="#d97757" stroke="#141413" strokeWidth="2.5" />
        <polygon points="50,68 84,50 84,68 50,86" fill="#b5573a" stroke="#141413" strokeWidth="2.5" />
        <polygon points="16,50 50,32 84,50 50,68" fill="#ebc9b7" stroke="#141413" strokeWidth="2.5" />
        <rect x="56" y="18" width="14" height="30" fill="#d97757" stroke="#141413" strokeWidth="2.2" />
      </svg>
    );
  }
  if (type === BuildingType.PoliceStation) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="16,48 50,66 50,86 16,68" fill="#6b7b8c" stroke="#141413" strokeWidth="2.5" />
        <polygon points="50,66 84,48 84,68 50,86" fill="#4a5d6e" stroke="#141413" strokeWidth="2.5" />
        <polygon points="16,48 50,30 84,48 50,66" fill="#b8c4cf" stroke="#141413" strokeWidth="2.5" />
        <circle cx="50" cy="48" r="7" fill="#d97757" stroke="#141413" strokeWidth="2" />
      </svg>
    );
  }
  if (type === BuildingType.School) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="16,52 50,70 50,86 16,68" fill="#f1f0ec" stroke="#141413" strokeWidth="2.5" />
        <polygon points="50,70 84,52 84,68 50,86" fill="#d5d1c6" stroke="#141413" strokeWidth="2.5" />
        <polygon points="16,52 50,34 84,52 50,70" fill="#ffffff" stroke="#141413" strokeWidth="2.5" />
        <rect x="44" y="18" width="12" height="22" fill="#d97757" stroke="#141413" strokeWidth="2" />
      </svg>
    );
  }
  if (type === BuildingType.Hospital) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105">
        <polygon points="16,46 50,64 50,86 16,68" fill="#ffffff" stroke="#141413" strokeWidth="2.5" />
        <polygon points="50,64 84,46 84,68 50,86" fill="#e1e1df" stroke="#141413" strokeWidth="2.5" />
        <polygon points="16,46 50,28 84,46 50,64" fill="#faf9f5" stroke="#141413" strokeWidth="2.5" />
        <path d="M 46,38 H 54 V 44 H 60 V 50 H 54 V 56 H 46 V 50 H 40 V 44 H 46 Z" fill="#c44536" stroke="#141413" strokeWidth="1.6" />
      </svg>
    );
  }
  return <div className="w-full h-full bg-sunk rounded-sm border border-ink" />;
};
