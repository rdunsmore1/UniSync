"use client";

const defaultEmojiOptions = ["👍", "❤️", "😂", "🎉", "🔥", "👀"];

interface MessageReaction {
  emoji: string;
  count: number;
  reactedByCurrentUser: boolean;
}

export function MessageReactionBar({
  isPickerOpen,
  onTogglePicker,
  onToggleReaction,
  reactions,
}: {
  isPickerOpen: boolean;
  onTogglePicker: () => void;
  onToggleReaction: (emoji: string) => void;
  reactions: MessageReaction[];
}) {
  const safeReactions = reactions ?? [];

  return (
    <div className="reaction-bar">
      <div className="reaction-chip-row">
        {safeReactions.map((reaction) => (
          <button
            className={
              reaction.reactedByCurrentUser
                ? "reaction-chip reaction-chip-active"
                : "reaction-chip"
            }
            key={reaction.emoji}
            onClick={() => onToggleReaction(reaction.emoji)}
            type="button"
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </button>
        ))}
      </div>
      <div className="reaction-picker-shell">
        <button
          className="message-action-button"
          onClick={onTogglePicker}
          type="button"
        >
          +
        </button>
        {isPickerOpen && (
          <div className="reaction-picker-popover">
            {defaultEmojiOptions.map((emoji) => (
              <button
                className="reaction-picker-option"
                key={emoji}
                onClick={() => onToggleReaction(emoji)}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
