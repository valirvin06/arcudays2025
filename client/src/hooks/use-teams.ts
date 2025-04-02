import { useQuery } from "@tanstack/react-query";

export type Team = {
  id: number;
  name: string;
  icon?: string;
  color?: string;
};

export const useTeams = (options = {}) => {
  return useQuery<Team[]>({
    queryKey: ['/api/teams'],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    ...options
  });
};
