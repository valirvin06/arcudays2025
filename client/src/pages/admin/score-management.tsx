import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useEvents } from '@/hooks/use-events';
import { useTeams } from '@/hooks/use-teams';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';

const ScoreManagement = () => {
  const { toast } = useToast();
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [goldTeam, setGoldTeam] = useState<number | null>(null);
  const [silverTeam, setSilverTeam] = useState<number | null>(null);
  const [bronzeTeam, setBronzeTeam] = useState<number | null>(null);
  const [nonWinners, setNonWinners] = useState<number[]>([]);
  const [noEntries, setNoEntries] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset form when event changes
  useEffect(() => {
    setGoldTeam(null);
    setSilverTeam(null);
    setBronzeTeam(null);
    setNonWinners([]);
    setNoEntries([]);
  }, [selectedEvent]);
  
  const isLoading = eventsLoading || teamsLoading;
  
  // Get available teams (those not already selected for medals, non-winners, or no entries)
  const getAvailableTeams = () => {
    if (!teams) return [];
    
    const selectedTeams = [goldTeam, silverTeam, bronzeTeam].filter(Boolean) as number[];
    return teams.filter(team => 
      !selectedTeams.includes(team.id) && 
      !nonWinners.includes(team.id) && 
      !noEntries.includes(team.id)
    );
  };
  
  // Add team to non-winners
  const addNonWinner = (teamId: number) => {
    if (!nonWinners.includes(teamId)) {
      // Remove from no entries if present
      if (noEntries.includes(teamId)) {
        setNoEntries(noEntries.filter(id => id !== teamId));
      }
      setNonWinners([...nonWinners, teamId]);
    }
  };
  
  // Remove team from non-winners
  const removeNonWinner = (teamId: number) => {
    setNonWinners(nonWinners.filter(id => id !== teamId));
  };
  
  // Add team to no entries
  const addNoEntry = (teamId: number) => {
    if (!noEntries.includes(teamId)) {
      // Remove from non-winners if present
      if (nonWinners.includes(teamId)) {
        setNonWinners(nonWinners.filter(id => id !== teamId));
      }
      setNoEntries([...noEntries, teamId]);
    }
  };
  
  // Remove team from no entries
  const removeNoEntry = (teamId: number) => {
    setNoEntries(noEntries.filter(id => id !== teamId));
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedEvent) {
      toast({
        title: "Error",
        description: "Please select an event",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get score settings for point values
      const settingsResponse = await fetch('/api/score-settings');
      const settings = await settingsResponse.json();
      
      const medals = [];
      
      // Add gold medal
      if (goldTeam) {
        medals.push({
          eventId: selectedEvent,
          teamId: goldTeam,
          medalType: 'GOLD',
          points: settings.goldPoints
        });
      }
      
      // Add silver medal
      if (silverTeam) {
        medals.push({
          eventId: selectedEvent,
          teamId: silverTeam,
          medalType: 'SILVER',
          points: settings.silverPoints
        });
      }
      
      // Add bronze medal
      if (bronzeTeam) {
        medals.push({
          eventId: selectedEvent,
          teamId: bronzeTeam,
          medalType: 'BRONZE',
          points: settings.bronzePoints
        });
      }
      
      // Add non-winners
      for (const teamId of nonWinners) {
        medals.push({
          eventId: selectedEvent,
          teamId,
          medalType: 'NON_WINNER',
          points: settings.nonWinnerPoints
        });
      }
      
      // Add no-entry teams
      for (const teamId of noEntries) {
        medals.push({
          eventId: selectedEvent,
          teamId,
          medalType: 'NO_ENTRY',
          points: 0 // No points for no-entry
        });
      }
      
      // Create medals one by one
      for (const medal of medals) {
        await apiRequest('POST', '/api/medals', medal);
      }
      
      // Update event status to completed
      await apiRequest('POST', '/api/events/' + selectedEvent, { status: 'COMPLETED' });
      
      // Reset form
      setSelectedEvent(null);
      setGoldTeam(null);
      setSilverTeam(null);
      setBronzeTeam(null);
      setNonWinners([]);
      setNoEntries([]);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/medals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scoreboard'] });
      
      toast({
        title: "Success",
        description: "Results saved successfully"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save results",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-montserrat font-semibold mb-6 text-[#000080]">Score Management</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 text-[#000080] animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label htmlFor="event-select" className="block mb-2 text-sm font-medium text-gray-700">Select Event</label>
              <Select
                value={selectedEvent?.toString()}
                onValueChange={(value) => setSelectedEvent(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedEvent && (
              <form className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Assign Places</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700">Gold Medal (1st Place)</label>
                    <Select
                      value={goldTeam?.toString()}
                      onValueChange={(value) => setGoldTeam(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Team" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableTeams().map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700">Silver Medal (2nd Place)</label>
                    <Select
                      value={silverTeam?.toString()}
                      onValueChange={(value) => setSilverTeam(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Team" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableTeams().map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700">Bronze Medal (3rd Place)</label>
                    <Select
                      value={bronzeTeam?.toString()}
                      onValueChange={(value) => setBronzeTeam(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Team" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableTeams().map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Non-Medal Participants</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {getAvailableTeams().filter(team => !nonWinners.includes(team.id)).map(team => (
                      <Button
                        key={team.id}
                        type="button"
                        variant="outline"
                        onClick={() => addNonWinner(team.id)}
                        className="justify-start"
                      >
                        <span className="material-icons mr-2 text-sm">add</span>
                        {team.name}
                      </Button>
                    ))}
                  </div>
                  
                  {nonWinners.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {nonWinners.map(teamId => {
                          const team = teams?.find(t => t.id === teamId);
                          return team ? (
                            <Badge key={teamId} variant="secondary" className="flex items-center gap-1 px-3 py-2">
                              {team.name}
                              <button
                                type="button"
                                onClick={() => removeNonWinner(teamId)}
                                className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                              >
                                <span className="material-icons text-sm">close</span>
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">No Entry Teams (0 points)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {getAvailableTeams().filter(team => 
                      !noEntries.includes(team.id) && 
                      !nonWinners.includes(team.id)
                    ).map(team => (
                      <Button
                        key={team.id}
                        type="button"
                        variant="outline"
                        onClick={() => addNoEntry(team.id)}
                        className="justify-start text-gray-500"
                      >
                        <span className="material-icons mr-2 text-sm">add</span>
                        {team.name}
                      </Button>
                    ))}
                  </div>
                  
                  {noEntries.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {noEntries.map(teamId => {
                          const team = teams?.find(t => t.id === teamId);
                          return team ? (
                            <Badge key={teamId} variant="outline" className="flex items-center gap-1 px-3 py-2 text-gray-500">
                              {team.name}
                              <button
                                type="button"
                                onClick={() => removeNoEntry(teamId)}
                                className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                              >
                                <span className="material-icons text-sm">close</span>
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      setSelectedEvent(null);
                      setGoldTeam(null);
                      setSilverTeam(null);
                      setBronzeTeam(null);
                      setNonWinners([]);
                      setNoEntries([]);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#000080] hover:bg-opacity-90"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Results"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ScoreManagement;
