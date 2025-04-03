import { Button } from "@components/ui/button";
import { ScrollArea } from "@components/ui/scroll-area";
import { cn } from "@lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import { Discussion } from "@lib/api/discussion";

interface DiscussionsSidebarProps {
  discussions: Discussion[];
  selectedDiscussionId: number | null;
  onSelectDiscussion: (discussionId: number) => void;
  onNewDiscussion: () => void;
}

const DiscussionsSidebar = ({
  discussions,
  selectedDiscussionId,
  onSelectDiscussion,
  onNewDiscussion,
}: DiscussionsSidebarProps) => {
  return (
    <div className="min-w-72 w-72 border-r h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">My Discussions</h3>
        <Button size="sm" className="rounded-2xl" onClick={onNewDiscussion}>
          New
        </Button>
      </div>

      {/* Discussions list */}
      <ScrollArea className="flex-1">
        <div className="px-2">
          {discussions.length > 0 ? (
            discussions.map((discussion) => (
              <button
                key={discussion.id}
                className={cn(
                  "w-full px-2 my-1 py-2 text-left rounded-md transition-colors flex flex-col",
                  "hover:bg-accent hover:text-accent-foreground",
                  selectedDiscussionId === discussion.id &&
                    "bg-accent text-accent-foreground"
                )}
                onClick={() => onSelectDiscussion(discussion.id)}
              >
                <span className="font-medium truncate">{discussion.title}</span>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span className="truncate">by {discussion.author.name}</span>
                  <span className="mx-1">·</span>
                  <span>
                    {formatDistanceToNow(new Date(discussion.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="flex items-center text-xs mt-1">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  <span>{discussion._count?.comments || 0}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No discussions yet. Create a new discussion to get started.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DiscussionsSidebar;
