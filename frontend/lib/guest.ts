const GUEST_ID_KEY = "packster-guest-id";
const DISPLAY_NAME_KEY = "packster-display-name";
const ROOM_PARTICIPANT_PREFIX = "packster-room-participant:";

export function getGuestId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  let id = window.localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(GUEST_ID_KEY, id);
  }

  return id;
}

export function getDisplayName(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(DISPLAY_NAME_KEY)?.trim() ?? "";
}

export function setDisplayName(name: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DISPLAY_NAME_KEY, name.trim());
}

export function getRoomParticipantId(roomId: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(`${ROOM_PARTICIPANT_PREFIX}${roomId}`) ?? "";
}

export function setRoomParticipantId(roomId: string, participantId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(`${ROOM_PARTICIPANT_PREFIX}${roomId}`, participantId);
}
