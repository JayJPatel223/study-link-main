import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";

interface CreateDiscussionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDiscussion: (title: string, content: string) => Promise<void>;
  trigger?: React.ReactNode;
}

const CreateDiscussionModal = ({
  isOpen,
  onOpenChange,
  onCreateDiscussion,
  trigger,
}: CreateDiscussionModalProps) => {
  const [newDiscussion, setNewDiscussion] = useState({
    title: "",
    content: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!newDiscussion.title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateDiscussion(newDiscussion.title, newDiscussion.content);
      setNewDiscussion({ title: "", content: "" });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a new discussion</DialogTitle>
            <DialogDescription>
              Start a new topic for your group to discuss.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                placeholder="Enter discussion title"
                value={newDiscussion.title}
                onChange={(e) =>
                  setNewDiscussion({
                    ...newDiscussion,
                    title: e.target.value,
                  })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content" className="text-right">
                Content
              </Label>
              <Textarea
                id="content"
                placeholder="What would you like to discuss?"
                value={newDiscussion.content}
                onChange={(e) =>
                  setNewDiscussion({
                    ...newDiscussion,
                    content: e.target.value,
                  })
                }
                className="col-span-3"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Discussion
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDiscussionModal;
