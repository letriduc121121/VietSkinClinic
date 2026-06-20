export interface Room {
  id: number;
  name: string;
  description?: string | null;
  active: boolean;
  doctorId?: number | null;
  doctor?: { id: number; user: { name: string; avatar: string | null } | null } | null;
}

export interface CreateRoomDto {
  name: string;
  description?: string;
}

export type UpdateRoomDto = Partial<CreateRoomDto> & { active?: boolean };

export interface RoomForm {
  name: string;
  doctorId: string;
}
