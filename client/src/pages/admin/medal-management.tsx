import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeams } from '@/hooks/use-teams';
import { useEvents } from '@/hooks/use-events';

type Medal = {
  id: number;
  eventId: number;
  teamId: number;
  medalType: string;
  points: number;
  createdAt: string;
};

const MedalManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [medalToDelete, setMedalToDelete] = useState<Medal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedMedalType, setSelectedMedalType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: teams } = useTeams();
  const { data: events } = useEvents();

  const { data: medals = [], isLoading } = useQuery<Medal[]>({
    queryKey: ['/api/medals'],
    staleTime: 10000,
  });

  const getTeamName = (teamId: number) => {
    const team = teams?.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const getEventName = (eventId: number) => {
    const event = events?.find(e => e.id === eventId);
    return event ? event.name : 'Unknown Event';
  };

  const getMedalLabel = (medalType: string) => {
    switch (medalType) {
      case 'GOLD': return 'Gold';
      case 'SILVER': return 'Silver';
      case 'BRONZE': return 'Bronze';
      case 'NON_WINNER': return 'Non-Winner';
      case 'NO_ENTRY': return 'No Entry';
      default: return medalType;
    }
  };

  const getMedalColor = (medalType: string) => {
    switch (medalType) {
      case 'GOLD': return 'bg-yellow-100 text-yellow-800';
      case 'SILVER': return 'bg-gray-100 text-gray-800';
      case 'BRONZE': return 'bg-orange-100 text-orange-800';
      case 'NON_WINNER': return 'bg-blue-100 text-blue-800';
      case 'NO_ENTRY': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteMedal = async () => {
    if (!medalToDelete) return;

    try {
      await apiRequest('DELETE', `/api/medals/${medalToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/medals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scoreboard'] });
      
      toast({
        title: "Success",
        description: "Medal deleted successfully"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete medal",
        variant: "destructive"
      });
    } finally {
      setMedalToDelete(null);
    }
  };
  
  const handleCreateMedal = async () => {
    if (!selectedEvent || !selectedTeam || !selectedMedalType) {
      toast({
        title: "Error",
        description: "Please select an event, team, and medal type",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get score settings for point values
      const settingsResponse = await fetch('/api/score-settings');
      const settings = await settingsResponse.json();
      
      let points = 0;
      switch (selectedMedalType) {
        case 'GOLD': points = settings.goldPoints; break;
        case 'SILVER': points = settings.silverPoints; break;
        case 'BRONZE': points = settings.bronzePoints; break;
        case 'NON_WINNER': points = settings.nonWinnerPoints; break;
        case 'NO_ENTRY': points = 0; break;
      }
      
      await apiRequest('POST', '/api/medals', {
        eventId: selectedEvent,
        teamId: selectedTeam,
        medalType: selectedMedalType,
        points
      });
      
      // Reset form
      setSelectedEvent(null);
      setSelectedTeam(null);
      setSelectedMedalType(null);
      setIsDialogOpen(false);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/medals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scoreboard'] });
      
      toast({
        title: "Success",
        description: "Medal created successfully"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create medal",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter medals based on search term
  const filteredMedals = medals.filter((medal: Medal) => {
    const teamName = getTeamName(medal.teamId).toLowerCase();
    const eventName = getEventName(medal.eventId).toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return teamName.includes(searchLower) || eventName.includes(searchLower);
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-montserrat font-semibold mb-6 text-[#000080]">Medal Management</h2>
        
        <div className="mb-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Medal Assignments</h3>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Search events or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-1 bg-[#000080] text-white hover:bg-opacity-90">
                    <Plus size={16} /> Assign Medal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign a New Medal</DialogTitle>
                    <DialogDescription>
                      Manually assign a medal to a team for a specific event.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="event" className="text-sm font-medium">Event</label>
                      <Select
                        value={selectedEvent?.toString() || ""}
                        onValueChange={(value) => setSelectedEvent(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event" />
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
                    
                    <div className="grid gap-2">
                      <label htmlFor="team" className="text-sm font-medium">Team</label>
                      <Select
                        value={selectedTeam?.toString() || ""}
                        onValueChange={(value) => setSelectedTeam(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams?.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="medalType" className="text-sm font-medium">Medal Type</label>
                      <Select
                        value={selectedMedalType || ""}
                        onValueChange={setSelectedMedalType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select medal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GOLD">Gold</SelectItem>
                          <SelectItem value="SILVER">Silver</SelectItem>
                          <SelectItem value="BRONZE">Bronze</SelectItem>
                          <SelectItem value="NON_WINNER">Non Winner</SelectItem>
                          <SelectItem value="NO_ENTRY">No Entry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateMedal} 
                      className="bg-[#000080] hover:bg-opacity-90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Assign Medal"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 text-[#000080] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Medal</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Date Assigned</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedals.length > 0 ? (
                    filteredMedals.map((medal: Medal) => (
                      <TableRow key={medal.id}>
                        <TableCell className="font-medium">{getEventName(medal.eventId)}</TableCell>
                        <TableCell>{getTeamName(medal.teamId)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMedalColor(medal.medalType)}`}>
                            {getMedalLabel(medal.medalType)}
                          </span>
                        </TableCell>
                        <TableCell>{medal.points}</TableCell>
                        <TableCell>{new Date(medal.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 h-auto"
                                onClick={() => setMedalToDelete(medal)}
                              >
                                <Trash2 size={18} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Medal</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this medal? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleDeleteMedal} 
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        {searchTerm ? "No medals match your search" : "No medals have been assigned yet"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MedalManagement;
