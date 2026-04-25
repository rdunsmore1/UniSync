"use client";

import { MessageReactionBar } from "./message-reaction-bar";
import { ReplyPreview } from "./reply-preview";
import { TimestampText } from "./timestamp-text";

interface RoomMessageItemData {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  replyToMessage: {
    id: string;
    authorId: string;
    authorName: string;
    body: string;
  } | null;
  reactions: Array<{
    emoji: string;
    count: number;
    reactedByCurrentUser: boolean;
  }>;
}

export function RoomMessageItem({
  isReactionPickerOpen,
  message,
  onReply,
  onToggleReaction,
  onToggleReactionPicker,
}: {
  isReactionPickerOpen: boolean;
  message: RoomMessageItemData;
  onReply: () => void;
  onToggleReaction: (emoji: string) => void;
  onToggleReactionPicker: () => void;
}) {
  return (
    <article className="message-row" key={message.id}>
      <div className="message-row-meta">
        <strong>{message.authorName}</strong>
        <TimestampText className="message-timestamp" value={message.createdAt} />
      </div>
      {message.replyToMessage && (
        <ReplyPreview replyToMessage={message.replyToMessage} />
      )}
      <p>{message.body}</p>
      <div className="message-row-footer">
        <MessageReactionBar
          isPickerOpen={isReactionPickerOpen}
          onTogglePicker={onToggleReactionPicker}
          onToggleReaction={onToggleReaction}
          reactions={message.reactions ?? []}
        />
        <button
          className="message-action-button"
          onClick={onReply}
          type="button"
        >
          Reply
        </button>
      </div>
    </article>
  );
}
