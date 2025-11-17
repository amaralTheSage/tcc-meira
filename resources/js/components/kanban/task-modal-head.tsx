import { Column } from "@/types/models";

export default function ModalHeader({ closeModal, column } : { closeModal: React.Dispatch<React.SetStateAction<boolean>>, column?: Column }) {
    return (
        <div className="flex justify-between items-center p-4 border-b border-neutral-700">
            <h2 className="text-lg font-bold text-white">{column ? (column.name || "Untitled Column") : "Task Details"}</h2>

            <button><i className="fa-solid fa-x hover:text-red-700 cursor-pointer" onClick={() => closeModal(false)}></i></button>
        </div>
    );
}