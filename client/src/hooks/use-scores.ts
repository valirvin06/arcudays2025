import { useQuery } from "@tanstack/react-query";

export type TeamScore = {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  totalScore: number;
  rank: number;
};

export type MedalSummary = {
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  totalMedals: number;
};

export type ScoreboardData = {
  teamScores: TeamScore[];
  medalSummary: MedalSummary;
  lastUpdated: string;
};

export const useScores = () => {
  return useQuery<ScoreboardData>({
    queryKey: ['/api/scoreboard'],
    refetchInterval: 60000, // Refetch every minute
  });
};
