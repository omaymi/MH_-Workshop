import { useState } from 'react';
import { supabase } from './lib/supabase';
import { CSVUpload } from './components/CSVUpload';
import { ScheduleView } from './components/ScheduleView';
import { Room, Teacher, Course, Schedule } from './types';
import { Calendar, Loader2, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roomsUploaded, setRoomsUploaded] = useState(false);
  const [teachersUploaded, setTeachersUploaded] = useState(false);
  const [coursesUploaded, setCoursesUploaded] = useState(false);

  const handleRoomsUpload = async (data: unknown[]) => {
    const roomsData = data as Room[];
    setRooms(roomsData);
    setRoomsUploaded(true);

    await supabase.from('rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('rooms').insert(
      roomsData.map(r => ({
        room_id: r.room_id,
        capacity: Number(r.capacity),
        type: r.type,
      }))
    );
  };

  const handleTeachersUpload = async (data: unknown[]) => {
    const teachersData = data as Teacher[];
    setTeachers(teachersData);
    setTeachersUploaded(true);

    await supabase.from('teachers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('teachers').insert(
      teachersData.map(t => ({
        teacher_id: t.teacher_id,
        name: t.name,
      }))
    );
  };

  const handleCoursesUpload = async (data: unknown[]) => {
    const coursesData = data as Course[];
    setCourses(coursesData);
    setCoursesUploaded(true);

    await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('courses').insert(
      coursesData.map(c => ({
        course_id: c.course_id,
        subject: c.subject,
        teacher_id: c.teacher_id,
        group_id: c.group_id,
        group_size: Number(c.group_size),
        room_type_req: c.room_type_req,
      }))
    );
  };

  const generateSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      // Local Optimization Fallback
      const { optimizeScheduleLocally } = await import('./utils/localOptimizer');
      const result = await optimizeScheduleLocally(courses, rooms);

      // Save result to Supabase if possible (optional, but good for persistence)
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        try {
          await supabase.from("schedules").insert({
            name: result.name,
            assignments: result.assignments,
            fitness: result.fitness,
            hard_violations: result.hard_violations,
            soft_score: result.soft_score,
          });
        } catch (e) {
          console.warn("Could not save to Supabase, but local generation worked:", e);
        }
      }

      setSchedule(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'optimisation locale');
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = roomsUploaded && teachersUploaded && coursesUploaded;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Optimiseur d'Emploi du Temps
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Générez automatiquement des emplois du temps optimaux avec algorithmes génétiques
          </p>
        </header>

        {!schedule ? (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Étape 1: Importez vos données
              </h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <CSVUpload
                  title="Salles (Rooms)"
                  onDataParsed={handleRoomsUpload}
                  uploaded={roomsUploaded}
                />
                <CSVUpload
                  title="Professeurs (Teachers)"
                  onDataParsed={handleTeachersUpload}
                  uploaded={teachersUploaded}
                />
                <CSVUpload
                  title="Cours (Courses)"
                  onDataParsed={handleCoursesUpload}
                  uploaded={coursesUploaded}
                />
              </div>

              {canGenerate && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Tous les fichiers sont chargés</span>
                  </div>
                </div>
              )}

              <button
                onClick={generateSchedule}
                disabled={!canGenerate || loading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${canGenerate && !loading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Optimisation en cours...
                  </span>
                ) : (
                  'Générer l\'Emploi du Temps Optimal'
                )}
              </button>

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Format des fichiers CSV</h3>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">fstm_rooms.csv</h4>
                  <code className="text-xs text-blue-700 block whitespace-pre">
                    room_id,capacity,type{'\n'}
                    A101,30,TD{'\n'}
                    B201,50,Amphi
                  </code>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">fstm_teachers.csv</h4>
                  <code className="text-xs text-purple-700 block whitespace-pre">
                    teacher_id,name{'\n'}
                    T001,Prof. Martin{'\n'}
                    T002,Dr. Dubois
                  </code>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">fstm_courses.csv</h4>
                  <code className="text-xs text-green-700 block whitespace-pre">
                    course_id,subject,teacher_id,{'\n'}
                    group_id,group_size,room_type_req{'\n'}
                    C001,Math,T001,G1,25,TD
                  </code>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="text-sm font-medium opacity-90 mb-2">Score de Fitness</div>
                  <div className="text-3xl font-bold">{schedule.fitness.toFixed(0)}</div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                  <div className="text-sm font-medium opacity-90 mb-2">Contraintes Dures</div>
                  <div className="text-3xl font-bold">{schedule.hard_violations}</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <div className="text-sm font-medium opacity-90 mb-2">Score Soft</div>
                  <div className="text-3xl font-bold">{schedule.soft_score}</div>
                </div>
              </div>
            </div>

            <ScheduleView
              schedule={schedule}
              courses={courses}
              rooms={rooms}
              teachers={teachers}
            />

            <button
              onClick={() => {
                setSchedule(null);
                setRoomsUploaded(false);
                setTeachersUploaded(false);
                setCoursesUploaded(false);
              }}
              className="w-full py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
            >
              Générer un Nouvel Emploi du Temps
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
