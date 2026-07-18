import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export function useGuestUser() {
    const [guestId, setGuestId] = useState<string>("");
    const [displayName, setDisplayName] = useState<string>("");

    useEffect(() => {
        // Get or create guest UUID
        let storedGuestId = localStorage.getItem("packster_guest_id");
        if (!storedGuestId) {
            storedGuestId = uuidv4();
            localStorage.setItem("packster_guest_id", storedGuestId);
        }
        setGuestId(storedGuestId);

        // Get stored display name if any
        const storedDisplayName = localStorage.getItem("packster_display_name");
        if (storedDisplayName) {
            setDisplayName(storedDisplayName);
        }
    }, []);

    const updateDisplayName = (name: string) => {
        setDisplayName(name);
        localStorage.setItem("packster_display_name", name);
    };

    const clearGuestSession = () => {
        localStorage.removeItem("packster_guest_id");
        localStorage.removeItem("packster_display_name");
        setGuestId("");
        setDisplayName("");
    };

    return {
        guestId,
        displayName,
        updateDisplayName,
        clearGuestSession,
    };
}
