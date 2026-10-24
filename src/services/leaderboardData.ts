export interface AspirantRank {
  rank: number;
  id: string;
  name: string;
  state: string;
  streakDays: number;
  totalStudyHours: number;
  consistencyPercent: number;
  isCurrentUser?: boolean;
}

export const LEADERBOARD_ASPIRANTS: AspirantRank[] = [
  {
    rank: 1,
    id: 'asp_1',
    name: 'Ananya Sharma',
    state: 'Delhi',
    streakDays: 45,
    totalStudyHours: 320,
    consistencyPercent: 98,
  },
  {
    rank: 2,
    id: 'asp_2',
    name: 'Rohan Verma',
    state: 'Uttar Pradesh',
    streakDays: 38,
    totalStudyHours: 290,
    consistencyPercent: 95,
  },
  {
    rank: 3,
    id: 'asp_3',
    name: 'Meera Iyer',
    state: 'Karnataka',
    streakDays: 31,
    totalStudyHours: 245,
    consistencyPercent: 94,
  },
  {
    rank: 4,
    id: 'asp_4',
    name: 'Priya Mukherjee',
    state: 'West Bengal',
    streakDays: 24,
    totalStudyHours: 210,
    consistencyPercent: 91,
  },
  {
    rank: 5,
    id: 'asp_5',
    name: 'Aspirant (You)',
    state: 'India',
    streakDays: 8,
    totalStudyHours: 142,
    consistencyPercent: 86,
    isCurrentUser: true,
  },
  {
    rank: 6,
    id: 'asp_6',
    name: 'Vikramaditya Rao',
    state: 'Telangana',
    streakDays: 7,
    totalStudyHours: 130,
    consistencyPercent: 82,
  },
  {
    rank: 7,
    id: 'asp_7',
    name: 'Tanvi Deshmukh',
    state: 'Maharashtra',
    streakDays: 5,
    totalStudyHours: 115,
    consistencyPercent: 78,
  },
];
