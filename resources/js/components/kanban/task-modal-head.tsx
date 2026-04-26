import { Column } from '@/types/models';

export default function ModalHeader({ closeModal, column }: { closeModal: React.Dispatch<React.SetStateAction<boolean>>; column?: Column }) {
    return (
        <div className="flex items-center justify-between border-b border-neutral-700 p-4">
            <h2 className="text-lg font-bold text-white">{column ? column.name || 'Untitled Column' : 'Task Details'}</h2>

            <button>
                <i className="fa-solid fa-x cursor-pointer hover:text-red-700" onClick={() => closeModal(false)}></i>
            </button>
        </div>
    );
}
