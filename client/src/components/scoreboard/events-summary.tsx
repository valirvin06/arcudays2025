import { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

const EventsSummary = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });

  const { data: eventResults = [], isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ['/api/events/results'],
  });

  const isLoading = categoriesLoading || eventsLoading;

  // Filter events by category
  const filteredEvents = eventResults?.filter((event: any) => {
    if (selectedCategory === "all") return true;
    return event.categoryId === parseInt(selectedCategory);
  }) || [];

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      {/* Event Categories Selector */}
      <div className="mb-8">
        <div className="mb-6 max-w-md mx-auto">
          <label htmlFor="event-category" className="block mb-2 text-sm font-medium text-gray-700">
            Filter by Category
          </label>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full" id="event-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((category: any) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Events List */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((event: any) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-[#000080] text-white px-6 py-4">
                <h3 className="font-montserrat font-semibold text-lg">{event.name}</h3>
                <p className="text-sm text-white text-opacity-80">{event.category}</p>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center mr-3">
                    <span className="material-icons text-white text-sm">looks_one</span>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{event.goldTeam?.name || 'Not awarded'}</span>
                  </div>
                </div>
                <div className="mb-4 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#C0C0C0] flex items-center justify-center mr-3">
                    <span className="material-icons text-white text-sm">looks_two</span>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{event.silverTeam?.name || 'Not awarded'}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#CD7F32] flex items-center justify-center mr-3">
                    <span className="material-icons text-white text-sm">looks_3</span>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{event.bronzeTeam?.name || 'Not awarded'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <span className="material-icons text-4xl text-gray-300 mb-2">event_busy</span>
          <h3 className="text-lg font-medium text-gray-700 mb-1">No Events Found</h3>
          <p className="text-gray-500">
            {selectedCategory === "all" 
              ? "There are no events to display yet."
              : "There are no events in this category."}
          </p>
        </div>
      )}
    </div>
  );
};

const LoadingSkeleton = () => (
  <div>
    <div className="mb-8">
      <div className="mb-6 max-w-md mx-auto">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <div className="bg-[#000080] text-white px-6 py-4">
            <Skeleton className="h-6 w-48 bg-white/20 mb-2" />
            <Skeleton className="h-4 w-24 bg-white/20" />
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full mr-3" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default EventsSummary;
