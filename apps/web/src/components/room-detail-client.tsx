"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@unisync/ui";
import { apiFetch, postJson } from "../lib/api";
import { ReplyPreview } from "./reply-preview";
import { RoomMessageItem } from "./room-message-item";
import { ProtectedPage } from "./protected-page";
import { SiteShell } from "./site-shell";

interface RoomDetail {
  id: string;
  name: string;
  topic: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  currentUserId: string;
  currentUserRole: "OWNER" | "ADMIN" | "VIEWER" | "MEMBER" | null;
  parentRoom: {
    id: string;
    name: string;
  } | null;
  subRooms: Array<{
    id: string;
    name: string;
    topic: string | null;
  }>;
  messages: Array<{
    id: string;
    authorId: string;
    body: string;
    createdAt: string;
    authorName: string;
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
  }>;
}

export function RoomDetailClient({ roomId }: { roomId: string }) {
  const [data, setData] = useState<RoomDetail | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [subRoomName, setSubRoomName] = useState("");
  const [subRoomPrivate, setSubRoomPrivate] = useState(false);
  const [subRoomError, setSubRoomError] = useState<string | null>(null);
  const [showSubRoomCreator, setShowSubRoomCreator] = useState(false);
  const [replyTarget, setReplyTarget] = useState<RoomDetail["messages"][number] | null>(null);
  const [openReactionPickerForMessageId, setOpenReactionPickerForMessageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageScrollRef = useRef<HTMLDivElement | null>(null);
  const messageFormRef = useRef<HTMLFormElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const canManageSubRooms =
    (data?.currentUserRole === "OWNER" || data?.currentUserRole === "ADMIN") &&
    !data?.parentRoom;
  const messageCount = data?.messages.length ?? 0;

  const scrollToBottom = useMemo(
    () => () => {
      const container = messageScrollRef.current;
      if (!container) {
        return;
      }

      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    },
    [],
  );

  function isNearBottom() {
    const container = messageScrollRef.current;
    if (!container) {
      return true;
    }

    return container.scrollHeight - container.scrollTop - container.clientHeight < 120;
  }

  async function load() {
    const response = await apiFetch<RoomDetail>(`/rooms/${roomId}`, {
      cache: "no-store",
    });
    setData(response);
  }

  useEffect(() => {
    void load();
  }, [roomId]);

  useEffect(() => {
    const nextCount = messageCount;
    const previousCount = previousMessageCountRef.current;
    const hasNewMessages = nextCount > previousCount;

    if (hasNewMessages && shouldStickToBottomRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }

    previousMessageCountRef.current = nextCount;
  }, [messageCount, scrollToBottom]);

  async function handleSendMessage(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    const replyToMessageId = String(formData.get("replyToMessageId") ?? "").trim() || undefined;
    if (!body) {
      return;
    }

    shouldStickToBottomRef.current = true;
    await postJson(`/rooms/${roomId}/messages`, { body, replyToMessageId });
    setReplyTarget(null);
    setOpenReactionPickerForMessageId(null);
    setSelectedFileName(null);
    messageFormRef.current?.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    await load();
  }

  async function handleCreateSubRoom() {
    if (!data || !subRoomName.trim()) {
      return;
    }

    setSubRoomError(null);

    try {
      await postJson(`/organizations/${data.organization.id}/rooms`, {
        name: subRoomName,
        parentRoomId: data.id,
        isPrivate: subRoomPrivate,
      });
      setSubRoomName("");
      setSubRoomPrivate(false);
      setShowSubRoomCreator(false);
      await load();
    } catch (requestError) {
      setSubRoomError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create sub-room.",
      );
    }
  }

  async function handleToggleReaction(messageId: string, emoji: string) {
    if (!data) {
      return;
    }

    const previousData = data;
    const nextMessages = data.messages.map((message) => {
      if (message.id !== messageId) {
        return message;
      }

      const existingReaction = message.reactions.find(
        (reaction) => reaction.emoji === emoji,
      );

      return {
        ...message,
        reactions: existingReaction
          ? message.reactions
              .map((reaction) =>
                reaction.emoji === emoji
                  ? {
                      ...reaction,
                      count: reaction.reactedByCurrentUser
                        ? reaction.count - 1
                        : reaction.count + 1,
                      reactedByCurrentUser: !reaction.reactedByCurrentUser,
                    }
                  : reaction,
              )
              .filter((reaction) => reaction.count > 0)
          : [
              ...message.reactions,
              {
                emoji,
                count: 1,
                reactedByCurrentUser: true,
              },
            ],
      };
    });

    setData({
      ...data,
      messages: nextMessages,
    });
    setOpenReactionPickerForMessageId(null);

    try {
      const response = await postJson<{
        item: Array<{
          emoji: string;
          count: number;
          reactedByCurrentUser: boolean;
        }>;
      }>(`/rooms/${roomId}/messages/${messageId}/reactions`, {
        emoji,
      });

      setData((currentData) =>
        currentData
          ? {
              ...currentData,
              messages: currentData.messages.map((message) =>
                message.id === messageId
                  ? {
                      ...message,
                      reactions: response.item,
                    }
                  : message,
              ),
            }
          : currentData,
      );
    } catch {
      setData(previousData);
    }
  }

  return (
    <ProtectedPage>
      <SiteShell>
        <section className="page-intro">
          <div>
            <p className="eyebrow">Room</p>
            <h2>{data?.name ?? "Loading room..."}</h2>
            <p className="muted">{data?.topic ?? "No topic yet."}</p>
            <div className="inline-meta">
              <a className="text-link" href={`/organizations/${data?.organization.slug ?? ""}`}>
                Back to organization
              </a>
              {data?.parentRoom && <span>Inside {data.parentRoom.name}</span>}
              {canManageSubRooms && (
                <button
                  className="ui-button ui-button-secondary"
                  onClick={() => {
                    setSubRoomError(null);
                    setShowSubRoomCreator((current) => !current);
                  }}
                  type="button"
                >
                  {showSubRoomCreator ? "Close sub-room form" : "Create sub-room"}
                </button>
              )}
            </div>
            {canManageSubRooms && showSubRoomCreator && (
              <div className="subroom-top-creator">
                <div className="subroom-inline-head">
                  <strong>Create sub-room</strong>
                  <span className="muted">
                    Add a nested room without leaving the conversation
                  </span>
                </div>
                <div className="subroom-inline-form">
                  <input
                    onChange={(event) => setSubRoomName(event.target.value)}
                    placeholder="Examples: Case Prep, New Member Questions"
                    type="text"
                    value={subRoomName}
                  />
                  <label className="subroom-checkbox">
                    <input
                      checked={subRoomPrivate}
                      onChange={(event) => setSubRoomPrivate(event.target.checked)}
                      type="checkbox"
                    />
                    Members only
                  </label>
                  <button
                    className="ui-button ui-button-primary"
                    onClick={() => void handleCreateSubRoom()}
                    type="button"
                  >
                    Add sub-room
                  </button>
                </div>
                {subRoomError && <p className="form-error">{subRoomError}</p>}
              </div>
            )}
          </div>
        </section>

        <div className="room-layout-grid">
          <Card title="Conversation" eyebrow="Messages">
            <div className="room-conversation-shell">
              <div
                className="message-list unified-message-list message-scroll-area"
                onScroll={() => {
                  shouldStickToBottomRef.current = isNearBottom();
                }}
                ref={messageScrollRef}
              >
                {data?.messages.length ? (
                  data.messages.map((message) => (
                    <RoomMessageItem
                      isReactionPickerOpen={openReactionPickerForMessageId === message.id}
                      key={message.id}
                      message={message}
                      onReply={() => {
                        setReplyTarget(message);
                        setOpenReactionPickerForMessageId(null);
                      }}
                      onToggleReaction={(emoji) => {
                        void handleToggleReaction(message.id, emoji);
                      }}
                      onToggleReactionPicker={() =>
                        setOpenReactionPickerForMessageId((current) =>
                          current === message.id ? null : message.id,
                        )
                      }
                    />
                  ))
                ) : (
                  <p className="muted">No messages yet. Start the conversation here.</p>
                )}
              </div>

              <div className="room-composer-wrap">
                {replyTarget && (
                  <ReplyPreview
                    onCancel={() => setReplyTarget(null)}
                    replyToMessage={replyTarget}
                    variant="composer"
                  />
                )}
                {selectedFileName && (
                  <div className="composer-attachment-preview">
                    <span>{selectedFileName}</span>
                    <span className="muted">
                      Attachment UI is ready. File upload storage can be wired next.
                    </span>
                  </div>
                )}
                <form
                  action={async (formData) => {
                    if (replyTarget) {
                      formData.set("replyToMessageId", replyTarget.id);
                    }
                    await handleSendMessage(formData);
                  }}
                  className="room-composer"
                  ref={messageFormRef}
                >
                  <label className="attachment-button" htmlFor={`room-file-${roomId}`}>
                    Add file
                  </label>
                  <input
                    className="visually-hidden"
                    id={`room-file-${roomId}`}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setSelectedFileName(file?.name ?? null);
                    }}
                    ref={fileInputRef}
                    type="file"
                  />
                  <input
                    className="composer-input"
                    name="body"
                    placeholder="Message this room"
                    required
                    type="text"
                  />
                  <button className="ui-button ui-button-primary" type="submit">
                    Send
                  </button>
                </form>
              </div>
            </div>
          </Card>

          <Card title="Sub-rooms" eyebrow="Nested spaces">
            <div className="list-grid">
              {data?.subRooms.length ? (
                data.subRooms.map((subRoom) => (
                  <a
                    className="room-link-card"
                    href={`/organizations/${data.organization.slug}/rooms/${subRoom.id}`}
                    key={subRoom.id}
                  >
                    <strong>{subRoom.name}</strong>
                    <span>{subRoom.topic ?? "No topic yet"}</span>
                  </a>
                ))
              ) : (
                <p className="muted">No sub-rooms yet.</p>
              )}
              {data?.parentRoom && (
                <p className="muted">
                  Sub-rooms can only be created from top-level rooms.
                </p>
              )}
            </div>
          </Card>
        </div>
      </SiteShell>
    </ProtectedPage>
  );
}
