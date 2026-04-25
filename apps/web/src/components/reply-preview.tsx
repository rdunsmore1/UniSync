"use client";

interface ReplyPreviewData {
  id: string;
  authorName: string;
  body: string;
}

function truncateReplyBody(value: string) {
  return value.length > 96 ? `${value.slice(0, 93)}...` : value;
}

export function ReplyPreview({
  replyToMessage,
  onCancel,
  variant = "message",
}: {
  replyToMessage: ReplyPreviewData;
  onCancel?: () => void;
  variant?: "composer" | "message";
}) {
  return (
    <div
      className={
        variant === "composer"
          ? "reply-preview reply-preview-composer"
          : "reply-preview reply-preview-message"
      }
    >
      <div className="reply-preview-copy">
        <strong>{replyToMessage.authorName}</strong>
        <span>{truncateReplyBody(replyToMessage.body)}</span>
      </div>
      {onCancel && (
        <button
          className="reply-preview-cancel"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
