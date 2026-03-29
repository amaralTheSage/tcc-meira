import { SharedData } from '@/types';
import { Project } from '@/types/models';
import { router, usePage } from '@inertiajs/react';
import EmojiPicker from 'emoji-picker-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ModalPlus from './modal-plus';

export default function ChatInput({ project }: { project: Project }) {
    const [message, setMessage] = useState('');

    const [menu, setMenuOpen] = useState(false);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isHoveringEmoji, setIsHoveringEmoji] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const handleReset = () => {
        setMessage('');
        setSelectedImage(null);
    };

    const handleImageSelect = (file: File) => {
        setSelectedImage(file);
        setMenuOpen(false);
    };

    const onEmojiClick = (emojiObject: any) => {
        setMessage((prevMessage) => prevMessage + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const { auth } = usePage<SharedData>().props;

    const chat = project.chat.id;

    function sendMessage() {
        const formData = new FormData();
        formData.append('chat_id', chat.toString());
        formData.append('user_id', auth.user.id.toString());
        formData.append('content', message);
        if (selectedImage) {
            formData.append('image', selectedImage);
        }

        router.post(route('message.store', project.id.toString()), formData, {
            preserveScroll: false,
            onSuccess: () => {
                handleReset();
                toast.success('Message sent successfully');
            },
            onError: () => {
                setMessage(message);
                toast.error('An error occurred when sending the message.');
            },
        });
    }

    return (
        <div className="relative flex w-full border-2 border-solid border-t-neutral-700 bg-accent p-3">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                }}
                className="m-auto flex h-full w-full items-center gap-2.5 rounded-2xl border-2 border-solid border-neutral-500"
            >
                <div className="h-full border-r-2 border-solid border-neutral-500">
                    <button
                        type="button"
                        className="fa-solid fa-plus cursor-pointer p-4 hover:text-red-600"
                        onClick={() => setMenuOpen(!menu)}
                    ></button>

                    {menu && <ModalPlus onImageSelect={handleImageSelect} />}
                </div>

                <input
                    className="grow resize-none focus:outline-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    type="text"
                    placeholder="Type a message..."
                />

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        className={`cursor-pointer text-xl ${isHoveringEmoji ? 'fa-solid fa-face-laugh text-red-600' : 'fa-solid fa-face-meh'}`}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        onMouseEnter={() => setIsHoveringEmoji(true)}
                        onMouseLeave={() => setIsHoveringEmoji(false)}
                    ></button>
                    <button
                        type="submit"
                        className="fa-solid fa-paper-plane cursor-pointer border-none bg-transparent p-4 hover:text-red-600"
                    ></button>
                </div>
            </form>

            {showEmojiPicker && (
                <div className="absolute right-0 bottom-full mb-2">
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
            )}
        </div>
    );
}
