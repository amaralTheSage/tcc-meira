export default function ModalHeader({ closeModal } : { closeModal: React.Dispatch<React.SetStateAction<boolean>> }) {
    return (
        <div className="flex justify-between items-center p-4 border-b border-neutral-700">
            ModalHeader

            <button><i className="fa-solid fa-x hover:text-red-700" onClick={() => closeModal(false)}></i></button>
        </div>
    );
}