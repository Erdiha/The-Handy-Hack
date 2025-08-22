"use client";

import { Modal } from "@/components/ui/Modal";

interface DeleteConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (deleteType: "me" | "everyone") => void;
  otherPersonName: string;
}

export function DeleteConversationModal({
  isOpen,
  onClose,
  onDelete,
  otherPersonName,
}: DeleteConversationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Conversation"
      size="sm"
    >
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">💬</div>
        <p className="text-slate-600">
          Choose how you want to delete this conversation with{" "}
          <span className="font-semibold">{otherPersonName}</span>
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onDelete("me")}
          className="w-full p-3 text-left rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <div className="font-medium text-slate-800">Delete for me</div>
          <div className="text-xs text-slate-500">
            Only remove from your device
          </div>
        </button>

        <button
          onClick={() => onDelete("everyone")}
          className="w-full p-3 text-left rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
        >
          <div className="font-medium text-red-700">Delete for everyone</div>
          <div className="text-xs text-red-500">
            Remove conversation for both users
          </div>
        </button>
      </div>
    </Modal>
  );
}
