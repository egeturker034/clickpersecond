export interface PlayerStats {
    level: number;
    xp: number;
    bestCPS: number;
    totalGames: number;
    totalClicks: number;
  }
  
  export interface RecentGame {
    cps: number;
    date: Date;
  }
  
  export type VisualEffect = 'None' | 'Particles' | 'Color Shift' | 'Fireworks' | any;
  export type SoundEffect = 'None' | 'Click' | 'Background Music' | 'Victory Fanfare' | any;
  
  export interface Effect {
    name: VisualEffect | SoundEffect | any;
    level: number;
  }
  
  export type ActiveTab = 'profile' | 'recentGames' | 'settings';