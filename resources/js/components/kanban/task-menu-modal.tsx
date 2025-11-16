import { ColumnTask } from "@/types/models";
import ModalHeader from "./task-modal-head";

export default function TaskMenuModal({task, closeModal} : {task?: ColumnTask, closeModal: React.Dispatch<React.SetStateAction<boolean>>}) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => closeModal(false)}>
            <div className="bg-neutral-800 rounded-md w-96 max-w-md shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <ModalHeader closeModal={closeModal} />
                <div className="p-4">
                    <h2 className="text-xl font-bold mb-4 text-white">{task?.title || "Untitled Task"}</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <textarea
                            className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Add a description..."
                            rows={3}
                            value={task?.description || ""}
                            readOnly
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
