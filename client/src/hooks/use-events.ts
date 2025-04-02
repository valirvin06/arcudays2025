import { useQuery } from "@tanstack/react-query";

export type Event = {
  id: number;
  name: string;
  categoryId: number;
  eventDate?: string;
  status: string;
};

export type EventResult = {
  id: number;
  name: string;
  category: string;
  categoryId: number;
  eventDate?: string;
  status: string;
  goldTeam?: { id: number; name: string };
  silverTeam?: { id: number; name: string };
  bronzeTeam?: { id: number; name: string };
};

export const useEvents = (options = {}) => {
  return useQuery<Event[]>({
    queryKey: ['/api/events'],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    ...options
  });
};

export const useEventResults = (options = {}) => {
  return useQuery<EventResult[]>({
    queryKey: ['/api/events/results'],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    ...options
  });
};
