export interface Room {
  id?: string;
  room_id: string;
  capacity: number;
  type: string;
  created_at?: string;
}

export interface Teacher {
  id?: string;
  teacher_id: string;
  name: string;
  created_at?: string;
}

export interface Course {
  id?: string;
  course_id: string;
  subject: string;
  teacher_id: string;
  group_id: string;
  group_size: number;
  room_type_req: string;
  created_at?: string;
}

export interface Assignment {
  course_id: string;
  slot: number;
  room: string;
}

export interface Schedule {
  id: string;
  name: string;
  assignments: Assignment[];
  fitness: number;
  hard_violations: number;
  soft_score: number;
  created_at: string;
}

export interface TimeSlot {
  id: number;
  label: string;
  day_idx: number;
}
