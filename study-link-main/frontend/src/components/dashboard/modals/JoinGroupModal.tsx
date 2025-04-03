import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { searchGroups } from "@lib/api/group";
import debounce from "lodash.debounce";
import { Loader2, Lock, LockOpen } from "lucide-react";

interface Group {
  id: string;
  name: string;
  private: boolean;
  description?: string;
  memberCount?: number;
}

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGroup: (groupId: string, password?: string) => void;
}

const JoinGroupModal = ({
  isOpen,
  onClose,
  onJoinGroup,
}: JoinGroupModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [password, setPassword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Fetch initial groups when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchInitialGroups();
    } else {
      // Reset state when modal closes
      setSearchQuery("");
      setSearchResults([]);
      setSelectedGroup(null);
      setPassword("");
      setSearchError("");
    }
  }, [isOpen]);

  // Fetch initial popular or recommended groups
  const fetchInitialGroups = async () => {
    setIsSearching(true);
    try {
      // Use empty string to get default/popular groups
      const results = await searchGroups("");
      setSearchResults(results);
    } catch (error) {
      console.error("Error fetching initial groups:", error);
      setSearchError("Unable to load groups. Please try searching instead.");
    } finally {
      setIsSearching(false);
    }
  };

  // Create a debounced search function
  useEffect(() => {
    const performSearch = debounce(async (query: string) => {
      setIsSearching(true);
      setSearchError("");

      try {
        const results = await searchGroups(query);
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching for groups:", error);
        setSearchError("Error searching for groups. Please try again.");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    performSearch(searchQuery);

    return () => {
      performSearch.cancel();
    };
  }, [searchQuery]);

  // Handle group selection
  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);

    // Clear password when switching groups
    if (selectedGroup?.id !== group.id) {
      setPassword("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGroup) return;

    // Only require password for private groups
    if (selectedGroup.private && !password) {
      return;
    }

    onJoinGroup(selectedGroup.id, selectedGroup.private ? password : undefined);

    // Reset state
    setSearchQuery("");
    setSelectedGroup(null);
    setPassword("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a Group</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search box */}
          <div className="space-y-2">
            <Label htmlFor="searchQuery">Search for a group</Label>
            <div className="relative">
              <Input
                type="text"
                id="searchQuery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Start typing to search for groups..."
                className="w-full"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {searchError && (
            <div className="text-sm text-destructive">{searchError}</div>
          )}

          {/* Search results or initial groups */}
          <div className="space-y-2">
            <Label>{searchQuery ? "Search Results" : "Available Groups"}</Label>
            <div className="max-h-64 overflow-y-auto border rounded-md">
              {searchResults.length > 0 ? (
                searchResults.map((group) => (
                  <div
                    key={group.id}
                    className={`p-2.5 cursor-pointer flex items-center justify-between rounded-md ${
                      selectedGroup?.id === group.id
                        ? "bg-primary/10 font-medium"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleSelectGroup(group)}
                  >
                    <div className="flex flex-col">
                      <span>{group.name}</span>
                      {group.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {group.description}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-xs text-muted-foreground flex items-center">
                        {group.private ? (
                          <span className="flex items-center">
                            <Lock className="w-3.5 h-3.5 mr-1" />
                            Private
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <LockOpen className="w-3.5 h-3.5 mr-1" />
                            Open
                          </span>
                        )}
                      </div>
                      {group.memberCount !== undefined && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {group.memberCount}{" "}
                          {group.memberCount === 1 ? "member" : "members"}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No groups found. Try a different search term.
                </div>
              )}
            </div>
          </div>

          {/* Password field (only shown for private groups) */}
          {selectedGroup?.private && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the group password"
                required
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedGroup || (selectedGroup.private && !password)}
            >
              Join Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinGroupModal;
