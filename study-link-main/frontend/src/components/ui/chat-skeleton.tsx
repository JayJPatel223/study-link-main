import { Skeleton } from "./skeleton";

export const ChatSkeleton = () => (
  <div className="space-y-6">
    {/* Date separator skeleton */}
    <div className="flex items-center justify-center my-4">
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>

    {[1, 2, 3, 4].map((index) => (
      <div
        key={index}
        className={`flex ${index % 2 === 0 ? "justify-end" : "justify-start"} ${
          index > 0 && index % 2 === (index - 1) % 2 ? "mt-1" : "mt-6"
        }`}
      >
        <div
          className={`flex gap-3 max-w-[80%] ${
            index % 2 === 0 ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {/* Only show avatar for first message in a group */}
          {index === 0 || index % 2 !== (index - 1) % 2 ? (
            <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-9 flex-shrink-0" />
          )}

          <div>
            {/* Only show name for others' messages at start of group */}
            {index % 2 !== 0 &&
              (index === 0 || index % 2 !== (index - 1) % 2) && (
                <Skeleton className="h-3 w-24 mb-1" />
              )}

            <div className="flex flex-col">
              <div
                className={`flex items-center gap-2 ${
                  index % 2 === 0 ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Skeleton
                  className={`h-12 w-48 rounded-3xl ${
                    index % 2 === 0 ? "bg-primary/30" : ""
                  }`}
                />
                {/* Timestamp skeleton */}
                <Skeleton className="h-3 w-12" />
              </div>

              {/* Action buttons for own messages */}
              {index % 2 === 0 && (
                <div className="flex justify-end gap-1 mt-1 px-1">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ))}

    {/* Another date separator */}
    <div className="flex items-center justify-center my-4">
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>

    {/* A few more message skeletons */}
    {[1, 2].map((index) => (
      <div
        key={`more-${index}`}
        className={`flex ${
          index % 2 === 0 ? "justify-start" : "justify-end"
        } mt-1`}
      >
        <div
          className={`flex gap-3 max-w-[80%] ${
            index % 2 === 1 ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {index === 1 ? (
            <div className="w-9 flex-shrink-0" />
          ) : (
            <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
          )}

          <div>
            <div className="flex flex-col">
              <div
                className={`flex items-center gap-2 ${
                  index % 2 === 1 ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Skeleton
                  className={`h-12 w-56 rounded-3xl ${
                    index % 2 === 1 ? "bg-primary/30" : ""
                  }`}
                />
                <Skeleton className="h-3 w-12" />
              </div>

              {index % 2 === 1 && (
                <div className="flex justify-end gap-1 mt-1 px-1">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);
