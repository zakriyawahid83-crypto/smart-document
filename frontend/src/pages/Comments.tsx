import { useEffect, useRef, useState } from "react";
import api from "../services/api";

interface CommentData {
  id: number;
  content: string;
  user_id: number;
  workspace_id: number;
  document_id: number;
}

interface CommentsProps {
  documentId: number;
}

function Comments({
  documentId,
}: CommentsProps) {
  const [comments, setComments] = useState<
    CommentData[]
  >([]);

  const [content, setContent] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editingContent, setEditingContent] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [connected, setConnected] =
    useState(false);

  const websocketRef =
    useRef<WebSocket | null>(null);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/comments/${documentId}`
      );

      setComments(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err: any) {
      console.error(
        "COMMENTS ERROR:",
        err
      );

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item: any) =>
                item.msg
            )
            .join(", ")
        );
      } else if (detail) {
        setError(String(detail));
      } else {
        setError(
          "Failed to load comments."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [documentId]);

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setConnected(false);
      return;
    }

    const protocol =
      window.location.protocol === "https:"
        ? "wss"
        : "ws";

    const host =
      "127.0.0.1:8000";

    const websocketUrl =
      `${protocol}://${host}/comments/ws/${documentId}?token=${encodeURIComponent(
        token
      )}`;

    const websocket =
      new WebSocket(websocketUrl);

    websocketRef.current =
      websocket;

    websocket.onopen = () => {
      setConnected(true);
    };

    websocket.onclose = () => {
      setConnected(false);
    };

    websocket.onerror = () => {
      setConnected(false);
    };

    websocket.onmessage = (
      event
    ) => {
      try {
        const data =
          JSON.parse(event.data);

        if (
          data.type ===
          "comment_created"
        ) {
          const newComment =
            data.comment as CommentData;

          setComments((current) => {
            const exists =
              current.some(
                (comment) =>
                  comment.id ===
                  newComment.id
              );

            if (exists) {
              return current;
            }

            return [
              ...current,
              newComment,
            ];
          });
        }

        if (
          data.type ===
          "comment_updated"
        ) {
          const updatedComment =
            data.comment as CommentData;

          setComments((current) =>
            current.map(
              (comment) =>
                comment.id ===
                updatedComment.id
                  ? updatedComment
                  : comment
            )
          );
        }

        if (
          data.type ===
          "comment_deleted"
        ) {
          setComments((current) =>
            current.filter(
              (comment) =>
                comment.id !==
                data.comment_id
            )
          );
        }
      } catch (err) {
        console.error(
          "WEBSOCKET MESSAGE ERROR:",
          err
        );
      }
    };

    return () => {
      websocket.close();
      websocketRef.current =
        null;
    };
  }, [documentId]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!content.trim()) {
      setError(
        "Comment cannot be empty."
      );
      return;
    }

    try {
      setSending(true);
      setError("");
      setMessage("");

      const response =
        await api.post(
          "/comments/",
          null,
          {
            params: {
              document_id:
                documentId,
              content:
                content.trim(),
            },
          }
        );

      const newComment =
        response.data as CommentData;

      setComments((current) => {
        const exists =
          current.some(
            (comment) =>
              comment.id ===
              newComment.id
          );

        if (exists) {
          return current;
        }

        return [
          ...current,
          newComment,
        ];
      });

      setContent("");

      setMessage(
        "Comment added successfully."
      );
    } catch (err: any) {
      console.error(
        "CREATE COMMENT ERROR:",
        err
      );

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item: any) =>
                item.msg
            )
            .join(", ")
        );
      } else if (detail) {
        setError(String(detail));
      } else {
        setError(
          "Failed to add comment."
        );
      }
    } finally {
      setSending(false);
    }
  };

  const startEdit = (
    comment: CommentData
  ) => {
    setEditingId(comment.id);
    setEditingContent(
      comment.content
    );
    setError("");
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const handleUpdate = async (
    commentId: number
  ) => {
    if (!editingContent.trim()) {
      setError(
        "Comment cannot be empty."
      );
      return;
    }

    try {
      setError("");
      setMessage("");

      const response =
        await api.put(
          `/comments/${commentId}`,
          null,
          {
            params: {
              content:
                editingContent.trim(),
            },
          }
        );

      const updatedComment =
        response.data as CommentData;

      setComments((current) =>
        current.map(
          (comment) =>
            comment.id ===
            updatedComment.id
              ? updatedComment
              : comment
        )
      );

      setEditingId(null);
      setEditingContent("");

      setMessage(
        "Comment updated successfully."
      );
    } catch (err: any) {
      console.error(
        "UPDATE COMMENT ERROR:",
        err
      );

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item: any) =>
                item.msg
            )
            .join(", ")
        );
      } else if (detail) {
        setError(String(detail));
      } else {
        setError(
          "Failed to update comment."
        );
      }
    }
  };

  const handleDelete = async (
    commentId: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this comment?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(commentId);
      setError("");
      setMessage("");

      await api.delete(
        `/comments/${commentId}`
      );

      setComments((current) =>
        current.filter(
          (comment) =>
            comment.id !==
            commentId
        )
      );

      setMessage(
        "Comment deleted successfully."
      );
    } catch (err: any) {
      console.error(
        "DELETE COMMENT ERROR:",
        err
      );

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item: any) =>
                item.msg
            )
            .join(", ")
        );
      } else if (detail) {
        setError(String(detail));
      } else {
        setError(
          "Failed to delete comment."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md">

      <div className="p-5 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium text-slate-800">
              Comments
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Discuss this document with other workspace members.
            </p>
          </div>

          <span
            className={
              connected
                ? "self-start text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full"
                : "self-start text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full"
            }
          >
            {connected
              ? "Live"
              : "Offline"}
          </span>
        </div>
      </div>

      <div className="p-5">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md px-4 py-3">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md px-4 py-3">
            <p className="text-sm text-green-700">
              {message}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mb-7"
        >
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Add a Comment
          </label>

          <textarea
            value={content}
            onChange={(event) =>
              setContent(
                event.target.value
              )
            }
            placeholder="Write your comment..."
            rows={4}
            className="w-full border border-slate-300 rounded-md px-4 py-3 text-sm text-slate-800 outline-none resize-y focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={sending}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
            >
              {sending
                ? "Adding..."
                : "Add Comment"}
            </button>
          </div>
        </form>

        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-slate-700">
              All Comments
            </h4>

            <span className="text-xs text-slate-400">
              {comments.length}{" "}
              {comments.length === 1
                ? "comment"
                : "comments"}
            </span>
          </div>

          {loading && (
            <div className="border border-slate-200 rounded-md p-8 text-center">
              <p className="text-sm text-slate-500">
                Loading comments...
              </p>
            </div>
          )}

          {!loading &&
            comments.length === 0 && (
              <div className="border border-slate-200 rounded-md p-8 text-center">
                <p className="text-sm text-slate-500">
                  No comments yet.
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Start the discussion by adding a comment.
                </p>
              </div>
            )}

          {!loading &&
            comments.length > 0 && (
              <div className="space-y-4">
                {comments.map(
                  (comment) => (
                    <div
                      key={comment.id}
                      className="border border-slate-200 rounded-md p-4 hover:border-blue-200 transition"
                    >
                      {editingId ===
                      comment.id ? (
                        <div>
                          <textarea
                            value={
                              editingContent
                            }
                            onChange={(
                              event
                            ) =>
                              setEditingContent(
                                event.target
                                  .value
                              )
                            }
                            rows={4}
                            className="w-full border border-blue-300 rounded-md px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 resize-y"
                          />

                          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3">
                            <button
                              type="button"
                              onClick={
                                cancelEdit
                              }
                              className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-md text-sm"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdate(
                                  comment.id
                                )
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                              <p className="text-xs text-slate-400">
                                User ID:{" "}
                                {comment.user_id}
                              </p>

                              <p className="text-sm text-slate-700 mt-2 whitespace-pre-line break-words">
                                {
                                  comment.content
                                }
                              </p>
                            </div>

                            <span className="shrink-0 text-xs text-slate-400">
                              #{comment.id}
                            </span>
                          </div>

                          <div className="flex flex-wrap justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() =>
                                startEdit(
                                  comment
                                )
                              }
                              className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-md text-sm"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  comment.id
                                )
                              }
                              disabled={
                                deletingId ===
                                comment.id
                              }
                              className="border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 px-3 py-2 rounded-md text-sm"
                            >
                              {deletingId ===
                              comment.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default Comments;
