import { useState } from 'react';
import { Schedule, Course, Room, Teacher, TimeSlot, Assignment } from '../types';
import { Users, User, DoorOpen } from 'lucide-react';

interface ScheduleViewProps {
  schedule: Schedule;
  courses: Course[];
  rooms: Room[];
  teachers: Teacher[];
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const PERIODS = ['08:30-10:15', '10:30-12:15', '14:30-16:15', '16:30-18:15'];

const COLORS = [
  'bg-blue-100 border-blue-300',
  'bg-purple-100 border-purple-300',
  'bg-green-100 border-green-300',
  'bg-yellow-100 border-yellow-300',
  'bg-pink-100 border-pink-300',
  'bg-indigo-100 border-indigo-300',
  'bg-orange-100 border-orange-300',
  'bg-teal-100 border-teal-300',
];

function getTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let idx = 0;
  for (let d = 0; d < DAYS.length; d++) {
    for (let p = 0; p < PERIODS.length; p++) {
      slots.push({
        id: idx,
        label: `${DAYS[d]} ${PERIODS[p]}`,
        day_idx: d,
      });
      idx++;
    }
  }
  return slots;
}

export function ScheduleView({ schedule, courses, rooms, teachers }: ScheduleViewProps) {
  const [viewMode, setViewMode] = useState<'students' | 'teachers' | 'rooms'>('students');
  const timeSlots = getTimeSlots();

  const coursesMap = courses.reduce((acc, c) => {
    acc[c.course_id] = c;
    return acc;
  }, {} as Record<string, Course>);

  const roomsMap = rooms.reduce((acc, r) => {
    acc[r.room_id] = r;
    return acc;
  }, {} as Record<string, Room>);

  const teachersMap = teachers.reduce((acc, t) => {
    acc[t.teacher_id] = t;
    return acc;
  }, {} as Record<string, Teacher>);

  const subjects = Array.from(new Set(courses.map(c => c.subject))).sort();
  const subjectColors = subjects.reduce((acc, sub, idx) => {
    acc[sub] = COLORS[idx % COLORS.length];
    return acc;
  }, {} as Record<string, string>);

  const getEntities = () => {
    if (viewMode === 'students') {
      return Array.from(new Set(courses.map(c => c.group_id))).sort();
    } else if (viewMode === 'teachers') {
      return teachers.map(t => t.teacher_id).sort();
    } else {
      return rooms.map(r => r.room_id).sort();
    }
  };

  const getAssignmentForSlot = (slot: number, entity: string): Assignment | null => {
    return schedule.assignments.find(a => {
      const course = coursesMap[a.course_id];
      if (a.slot !== slot) return false;

      if (viewMode === 'students') return course.group_id === entity;
      if (viewMode === 'teachers') return course.teacher_id === entity;
      if (viewMode === 'rooms') return a.room === entity;
      return false;
    }) || null;
  };

  const renderCell = (assignment: Assignment | null) => {
    if (!assignment) {
      return <div className="h-full flex items-center justify-center text-gray-300">-</div>;
    }

    const course = coursesMap[assignment.course_id];
    const room = roomsMap[assignment.room];
    const teacher = teachersMap[course.teacher_id];
    const colorClass = subjectColors[course.subject];

    return (
      <div className={`h-full p-2 border-l-4 rounded ${colorClass} flex flex-col justify-center text-xs`}>
        <div className="font-bold mb-1">{course.subject}</div>
        {viewMode === 'students' && (
          <>
            <div className="text-gray-600">{room?.room_id || assignment.room}</div>
            <div className="text-gray-600">{teacher?.name || course.teacher_id}</div>
          </>
        )}
        {viewMode === 'teachers' && (
          <>
            <div className="text-gray-600">{room?.room_id || assignment.room}</div>
            <div className="text-gray-600">{course.group_id}</div>
          </>
        )}
        {viewMode === 'rooms' && (
          <>
            <div className="text-gray-600">{course.group_id}</div>
            <div className="text-gray-600">{teacher?.name || course.teacher_id}</div>
          </>
        )}
      </div>
    );
  };

  const entities = getEntities();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Emploi du Temps</h2>
          <p className="text-sm text-gray-500 mt-1">{schedule.name}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'students'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-5 h-5" />
            Groupes
          </button>
          <button
            onClick={() => setViewMode('teachers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'teachers'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User className="w-5 h-5" />
            Professeurs
          </button>
          <button
            onClick={() => setViewMode('rooms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'rooms'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <DoorOpen className="w-5 h-5" />
            Salles
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-gray-800 text-white px-4 py-3 text-left font-semibold border border-gray-700">
                Horaire
              </th>
              {entities.map(entity => (
                <th
                  key={entity}
                  className="bg-gray-800 text-white px-4 py-3 text-center font-semibold border border-gray-700 min-w-[200px]"
                >
                  {viewMode === 'teachers' ? teachersMap[entity]?.name || entity : entity}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(slot => (
              <tr key={slot.id} className="hover:bg-gray-50">
                <td className="sticky left-0 bg-gray-100 px-4 py-3 font-medium text-sm border border-gray-300 whitespace-nowrap">
                  {slot.label}
                </td>
                {entities.map(entity => (
                  <td key={entity} className="border border-gray-300 p-2 h-24">
                    {renderCell(getAssignmentForSlot(slot.id, entity))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
