import { useState } from 'react';
import { supabase } from './lib/supabase';
import { CSVUpload } from './components/CSVUpload';
import { ScheduleView } from './components/ScheduleView';
import { Sidebar } from './components/Sidebar';
import { Room, Teacher, Course, Schedule } from './types';
import { Calendar, Loader2, AlertCircle, CheckCircle2, TrendingUp, Upload } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roomsUploaded, setRoomsUploaded] = useState(false);
  const [teachersUploaded, setTeachersUploaded] = useState(false);
  const [coursesUploaded, setCoursesUploaded] = useState(false);

  // Preview State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewTitle, setPreviewTitle] = useState('');

  const openPreview = (title: string, data: any[]) => {
    setPreviewTitle(title);
    setPreviewData(data);
    setPreviewOpen(true);
  };

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

      // Save result to Supabase if possible
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
      setActiveTab('schedule'); // Switch to schedule tab automatically
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'optimisation locale');
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = roomsUploaded && teachersUploaded && coursesUploaded;

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex font-sans text-[#2D1B12]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 ml-80 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header */}
          <header className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[#2D1B12]">
                {activeTab === 'dashboard' && 'Tableau de Bord'}
                {activeTab === 'schedule' && 'Emploi du Temps'}
                {activeTab === 'teachers' && 'Gestion des Professeurs'}
                {activeTab === 'rooms' && 'Gestion des Salles'}
                {activeTab === 'courses' && 'Gestion des Cours'}
              </h1>
              <p className="text-[#8D6E63] mt-1">
                {activeTab === 'dashboard' && 'Gérez vos données et générez vos emplois du temps.'}
                {activeTab === 'schedule' && 'Visualisez et exportez l\'emploi du temps généré.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#8D6E63]">Année Universitaire 2025-2026</span>
              <div className="h-8 w-px bg-[#D7CCC8]"></div>
              <button className="bg-white border border-[#D7CCC8] text-[#5D4037] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#EFEBE9] transition-colors shadow-sm">
                Aide
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats / Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-2xl border ${roomsUploaded ? 'bg-[#E8F5E9] border-[#C8E6C9]' : 'bg-white border-[#D7CCC8]'} transition-all shadow-sm`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${roomsUploaded ? 'bg-[#C8E6C9] text-[#2E7D32]' : 'bg-[#EFEBE9] text-[#8D6E63]'}`}>
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    {roomsUploaded && <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />}
                  </div>
                  <h3 className="text-lg font-semibold text-[#2D1B12]">Salles</h3>
                  <p className="text-[#8D6E63] text-sm mt-1">{rooms.length > 0 ? `${rooms.length} salles chargées` : 'En attente de données'}</p>
                </div>

                <div className={`p-6 rounded-2xl border ${teachersUploaded ? 'bg-[#E3F2FD] border-[#BBDEFB]' : 'bg-white border-[#D7CCC8]'} transition-all shadow-sm`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${teachersUploaded ? 'bg-[#BBDEFB] text-[#1565C0]' : 'bg-[#EFEBE9] text-[#8D6E63]'}`}>
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    {teachersUploaded && <CheckCircle2 className="w-5 h-5 text-[#1565C0]" />}
                  </div>
                  <h3 className="text-lg font-semibold text-[#2D1B12]">Professeurs</h3>
                  <p className="text-[#8D6E63] text-sm mt-1">{teachers.length > 0 ? `${teachers.length} professeurs chargés` : 'En attente de données'}</p>
                </div>

                <div className={`p-6 rounded-2xl border ${coursesUploaded ? 'bg-[#F3E5F5] border-[#E1BEE7]' : 'bg-white border-[#D7CCC8]'} transition-all shadow-sm`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${coursesUploaded ? 'bg-[#E1BEE7] text-[#7B1FA2]' : 'bg-[#EFEBE9] text-[#8D6E63]'}`}>
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    {coursesUploaded && <CheckCircle2 className="w-5 h-5 text-[#7B1FA2]" />}
                  </div>
                  <h3 className="text-lg font-semibold text-[#2D1B12]">Cours</h3>
                  <p className="text-[#8D6E63] text-sm mt-1">{courses.length > 0 ? `${courses.length} cours chargés` : 'En attente de données'}</p>
                </div>
              </div>

              {/* Upload Section */}
              <div className="bg-white rounded-2xl shadow-md border border-[#D7CCC8] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#EFEBE9] rounded-lg">
                    <Upload className="w-5 h-5 text-[#5D4037]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#2D1B12]">Importation des Données</h2>
                </div>

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

                <div className="flex items-center justify-end pt-6 border-t border-[#EFEBE9]">
                  <button
                    onClick={generateSchedule}
                    disabled={!canGenerate || loading}
                    className={`flex items-center gap-3 py-3 px-8 rounded-xl font-semibold text-lg transition-all ${canGenerate && !loading
                      ? 'bg-[#8B5E3C] hover:bg-[#6D4C41] text-white shadow-lg shadow-[#8B5E3C]/20 transform hover:-translate-y-0.5'
                      : 'bg-[#EFEBE9] text-[#A1887F] cursor-not-allowed'
                      }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Optimisation en cours...
                      </>
                    ) : (
                      'Lancer l\'Optimisation'
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}
              </div>

              {/* File Format Info */}
              <div className="bg-white rounded-2xl shadow-md border border-[#D7CCC8] p-8">
                <h3 className="text-lg font-bold text-[#2D1B12] mb-6">Format des fichiers attendu</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA]">
                    <h4 className="font-semibold text-[#2D1B12] mb-2 text-sm">fstm_rooms.csv</h4>
                    <code className="text-xs text-[#5D4037] font-mono block bg-white p-3 rounded-lg border border-[#E0E0E0]">
                      room_id,capacity,type{'\n'}
                      A101,30,TD{'\n'}
                      B201,50,Amphi
                    </code>
                  </div>
                  <div className="p-4 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA]">
                    <h4 className="font-semibold text-[#2D1B12] mb-2 text-sm">fstm_teachers.csv</h4>
                    <code className="text-xs text-[#5D4037] font-mono block bg-white p-3 rounded-lg border border-[#E0E0E0]">
                      teacher_id,name{'\n'}
                      T001,Prof. Martin{'\n'}
                      T002,Dr. Dubois
                    </code>
                  </div>
                  <div className="p-4 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA]">
                    <h4 className="font-semibold text-[#2D1B12] mb-2 text-sm">fstm_courses.csv</h4>
                    <code className="text-xs text-[#5D4037] font-mono block bg-white p-3 rounded-lg border border-[#E0E0E0]">
                      course_id,subject,teacher_id,{'\n'}
                      group_id,group_size,room_type_req{'\n'}
                      C001,Math,T001,G1,25,TD
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {schedule ? (
                <>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm">
                      <div className="text-sm font-medium text-[#8D6E63] mb-1">Score de Fitness</div>
                      <div className="text-3xl font-bold text-[#8B5E3C]">{schedule.fitness.toFixed(0)}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm">
                      <div className="text-sm font-medium text-[#8D6E63] mb-1">Conflits (Hard)</div>
                      <div className="text-3xl font-bold text-red-600">{schedule.hard_violations}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm">
                      <div className="text-sm font-medium text-[#8D6E63] mb-1">Score Soft</div>
                      <div className="text-3xl font-bold text-orange-600">{schedule.soft_score}</div>
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
                    className="w-full py-3 px-6 rounded-xl font-semibold text-[#5D4037] bg-[#EFEBE9] hover:bg-[#D7CCC8] transition-all"
                  >
                    Générer un Nouvel Emploi du Temps
                  </button>
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-[#D7CCC8] border-dashed">
                  <div className="w-16 h-16 bg-[#EFEBE9] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-[#8D6E63]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#2D1B12]">Aucun emploi du temps généré</h3>
                  <p className="text-[#8D6E63] mt-2">Veuillez importer vos données et lancer l'optimisation depuis le tableau de bord.</p>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="mt-6 text-[#8B5E3C] font-medium hover:text-[#6D4C41] hover:underline"
                  >
                    Aller au Tableau de Bord
                  </button>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'teachers' || activeTab === 'rooms' || activeTab === 'courses') && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#D7CCC8] p-12 text-center">
              <div className="w-20 h-20 bg-[#EFEBE9] rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-[#A1887F]" />
              </div>
              <h3 className="text-xl font-bold text-[#2D1B12]">Module en construction</h3>
              <p className="text-[#8D6E63] mt-2 max-w-md mx-auto">
                Cette fonctionnalité sera bientôt disponible. Pour l'instant, veuillez utiliser le tableau de bord pour importer vos données.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
