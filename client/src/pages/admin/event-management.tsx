import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useEvents } from '@/hooks/use-events';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
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

const EventManagement = () => {
  const { toast } = useToast();
  
  // States for event form
  const [eventName, setEventName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newCategory, setNewCategory] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for filtering events
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  
  // Fetch events and categories
  const { data: eventsData, isLoading: eventsLoading } = useEvents();
  
  // Get categories from backend
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });
  
  // Handle category selection change
  useEffect(() => {
    if (selectedCategory === 'new') {
      setShowNewCategoryField(true);
    } else {
      setShowNewCategoryField(false);
    }
  }, [selectedCategory]);
  
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an event name",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let categoryId = parseInt(selectedCategory);
      
      // If adding a new category
      if (showNewCategoryField && newCategory.trim()) {
        const categoryResponse = await apiRequest('POST', '/api/categories', {
          name: newCategory.trim()
        });
        const newCategoryData = await categoryResponse.json();
        categoryId = newCategoryData.id;
      }
      
      // Create the event
      await apiRequest('POST', '/api/events', {
        name: eventName.trim(),
        categoryId: isNaN(categoryId) ? undefined : categoryId,
        eventDate: eventDate ? eventDate : undefined,
        status: 'UPCOMING'
      });
      
      // Reset form
      setEventName('');
      setSelectedCategory('');
      setNewCategory('');
      setEventDate('');
      setShowNewCategoryField(false);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      
      toast({
        title: "Success",
        description: "Event created successfully"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteEvent = async () => {
    if (eventToDelete === null) return;
    
    try {
      await apiRequest('DELETE', `/api/events/${eventToDelete}`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      
      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete event. It may have associated medals.",
        variant: "destructive"
      });
    } finally {
      setEventToDelete(null);
    }
  };
  
  const getCategoryName = (categoryId: number) => {
    if (!categories) return 'Unknown';
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ONGOING': return 'bg-blue-100 text-blue-800';
      case 'UPCOMING': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Filter events based on category
  const filteredEvents = eventsData ? eventsData.filter((event: any) => {
    if (categoryFilter === 'all') return true;
    return event.categoryId === parseInt(categoryFilter);
  }) : [];
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-montserrat font-semibold mb-6 text-[#000080]">Event Management</h2>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Add New Event */}
          <div className="w-full md:w-1/3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Add New Event</h3>
              
              <form onSubmit={handleCreateEvent}>
                <div className="mb-4">
                  <Label htmlFor="event-name" className="block mb-2">Event Name</Label>
                  <Input
                    id="event-name"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Enter event name"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="event-category" className="block mb-2">Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {!categoriesLoading && categories && categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">Add New Category...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {showNewCategoryField && (
                  <div className="mb-4">
                    <Label htmlFor="new-category" className="block mb-2">New Category Name</Label>
                    <Input
                      id="new-category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category name"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <Label htmlFor="event-date" className="block mb-2">Event Date</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#000080] hover:bg-opacity-90" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Event"
                  )}
                </Button>
              </form>
            </div>
          </div>
          
          {/* Events List */}
          <div className="w-full md:w-2/3">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Scheduled Events</h3>
              <div>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {!categoriesLoading && categories && categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {eventsLoading || categoriesLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 text-[#000080] animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.length > 0 ? (
                      filteredEvents.map((event: any) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.name}</TableCell>
                          <TableCell>{getCategoryName(event.categoryId)}</TableCell>
                          <TableCell>{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'Not set'}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(event.status)}`}>
                              {event.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 h-auto"
                                  onClick={() => setEventToDelete(event.id)}
                                >
                                  <Trash2 size={18} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this event? This action cannot be undone.
                                    Note: Events with assigned medals cannot be deleted.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={handleDeleteEvent} 
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
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          {categoryFilter !== 'all' ? "No events in this category" : "No events have been added yet"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventManagement;
