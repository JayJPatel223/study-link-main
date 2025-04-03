import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Discussion } from "../../../lib/api/discussion";

interface ViewDiscussionModalProps {
  discussion: Discussion | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  onViewFullDiscussion?: () => void;
}

const ViewDiscussionModal = ({
  discussion,
  isOpen,
  onOpenChange,
  groupId,
  onViewFullDiscussion,
}: ViewDiscussionModalProps) => {
  if (!discussion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{discussion.title}</DialogTitle>
          <DialogDescription>
            Posted by {discussion.author.name} ·{" "}
            {formatDistanceToNow(new Date(discussion.createdAt), {
              addSuffix: true,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="whitespace-pre-wrap">
            {discussion.content || "No content provided."}
          </p>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (onViewFullDiscussion) {
                onViewFullDiscussion();
              } else {
                window.location.href = `/dashboard/groups/${groupId}/discussions/${discussion.id}`;
              }
              onOpenChange(false);
            }}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            View Full Discussion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewDiscussionModal;
