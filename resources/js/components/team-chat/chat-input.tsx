import { Project } from "@/types/models";
import { SetStateAction, useState } from "react";
import { Auth, SharedData } from "@/types";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";

export default function ChatInput({ project } : { project: Project }) {

    const [ message, setMessage ] = useState("");

    const handleReset = () => {
      setMessage('');
    };

    const { auth } = usePage<SharedData>().props;

    const chat = project.chat.id;

    function sendMessage(){
        const newMessageData = { chat_id: chat, content: message, user_id: auth.user.id };

        router.post(
            route('message.store', project.id.toString()),
                newMessageData,
            {
                preserveScroll: false,
                onSuccess: () => {
                    handleReset()
                    toast.success('Message sent successfully');
                },
                onError: () => {
                    setMessage(message); 
                    toast.error('An error occurred when sending the message.');
                }
            }
        );
        
    }

    return(
        <div className="flex w-full h-1/12 bg-accent shadow-2xs shadow-black border-solid border-2 border-t-neutral-700 px-3">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} 
                  className="flex flex-col rounded-2xl gap-2.5 m-auto w-full h-full border-2 border-solid border-neutral-500 p-2">
                <input
                    className="grow focus:outline-none resize-none" // Adicionei resize-none
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    type="text"
                    placeholder="Type a message..."
                />
                <div className="w-full flex justify-between">
                    <i className="fa-solid fa-plus cursor-pointer"></i>
                    <button type="submit" className="fa-solid fa-paper-plane cursor-pointer border-none bg-transparent"></button>
                </div>
            </form>
        </div>
    )
}