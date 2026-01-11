import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WEIGHT_HARD = 10000;
const WEIGHT_SOFT_GAP = 10;
const WEIGHT_SOFT_BALANCE = 5;
const SLOTS_PER_DAY = 4;
const GA_POP_SIZE = 200;
const GA_MUT_RATE = 0.3;
const GA_ELITE = 15;
const GA_GENS = 100;
const TABU_MAX_ITERS = 200;
const TABU_SIZE = 50;

interface Room {
  room_id: string;
  capacity: number;
  type: string;
}

interface Teacher {
  teacher_id: string;
  name: string;
}

interface Course {
  course_id: string;
  subject: string;
  teacher_id: string;
  group_id: string;
  group_size: number;
  room_type_req: string;
}

interface Gene {
  course_id: string;
  slot: number;
  room: string;
}

class Schedule {
  assignments: Gene[];
  fitness: number;
  hard_count: number;
  soft_score: number;

  constructor(assignments: Gene[] = []) {
    this.assignments = assignments;
    this.fitness = Infinity;
    this.hard_count = 0;
    this.soft_score = 0;
  }

  copy(): Schedule {
    const newSchedule = new Schedule(JSON.parse(JSON.stringify(this.assignments)));
    newSchedule.fitness = this.fitness;
    newSchedule.hard_count = this.hard_count;
    newSchedule.soft_score = this.soft_score;
    return newSchedule;
  }
}

function getTimeSlots() {
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const periods = ["08:30-10:15", "10:30-12:15", "14:30-16:15", "16:30-18:15"];
  const slots = [];
  let idx = 0;
  for (const d of days) {
    for (const p of periods) {
      slots.push({ id: idx, label: `${d} ${p}`, day_idx: Math.floor(idx / SLOTS_PER_DAY) });
      idx++;
    }
  }
  return slots;
}

function calculateFitness(
  schedule: Schedule,
  roomsDict: Record<string, Room>,
  coursesDict: Record<string, Course>
): number {
  let hardViolations = 0;
  let softPenalty = 0;
  const teacherSlots: Record<string, boolean> = {};
  const roomSlots: Record<string, boolean> = {};
  const groupSlots: Record<string, boolean> = {};
  const groupDailySchedule: Record<string, Record<number, number[]>> = {};

  for (const gene of schedule.assignments) {
    const course = coursesDict[gene.course_id];
    const room = roomsDict[gene.room];
    const slot = gene.slot;
    const dayIdx = Math.floor(slot / SLOTS_PER_DAY);

    let isHardViolated = false;

    if (course.group_size > room.capacity) {
      isHardViolated = true;
    }

    const tKey = `${course.teacher_id}_${slot}`;
    const rKey = `${gene.room}_${slot}`;
    const gKey = `${course.group_id}_${slot}`;

    if (teacherSlots[tKey] || roomSlots[rKey] || groupSlots[gKey]) {
      isHardViolated = true;
    }

    teacherSlots[tKey] = true;
    roomSlots[rKey] = true;
    groupSlots[gKey] = true;

    if (isHardViolated) hardViolations++;

    if (!groupDailySchedule[course.group_id]) {
      groupDailySchedule[course.group_id] = {};
    }
    if (!groupDailySchedule[course.group_id][dayIdx]) {
      groupDailySchedule[course.group_id][dayIdx] = [];
    }
    groupDailySchedule[course.group_id][dayIdx].push(slot);
  }

  for (const grp in groupDailySchedule) {
    for (const day in groupDailySchedule[grp]) {
      const slots = groupDailySchedule[grp][day].sort((a, b) => a - b);
      if (slots.length > 1) {
        const holes = Math.max(0, slots[slots.length - 1] - slots[0] - (slots.length - 1));
        softPenalty += holes * WEIGHT_SOFT_GAP;
      }
      if (slots.length > 3) {
        softPenalty += WEIGHT_SOFT_BALANCE;
      }
    }
  }

  schedule.hard_count = hardViolations;
  schedule.soft_score = softPenalty;
  schedule.fitness = hardViolations * WEIGHT_HARD + softPenalty;
  return schedule.fitness;
}

function getValidRooms(course: Course, roomsDict: Record<string, Room>, allRoomIds: string[]): string[] {
  const valid = allRoomIds.filter(
    (rid) => roomsDict[rid].type === course.room_type_req && roomsDict[rid].capacity >= course.group_size
  );
  return valid.length > 0 ? valid : allRoomIds;
}

function runGeneticAlgorithm(
  coursesList: Course[],
  slotIds: number[],
  roomsDict: Record<string, Room>,
  coursesDict: Record<string, Course>,
  roomIds: string[]
): Schedule {
  const population: Schedule[] = [];

  for (let i = 0; i < GA_POP_SIZE; i++) {
    const genes: Gene[] = coursesList.map((c) => ({
      course_id: c.course_id,
      slot: slotIds[Math.floor(Math.random() * slotIds.length)],
      room: getValidRooms(c, roomsDict, roomIds)[Math.floor(Math.random() * getValidRooms(c, roomsDict, roomIds).length)],
    }));
    population.push(new Schedule(genes));
  }

  let bestGA: Schedule | null = null;
  let lastBestFit = Infinity;
  let stagnation = 0;

  for (let gen = 0; gen < GA_GENS; gen++) {
    for (const s of population) {
      calculateFitness(s, roomsDict, coursesDict);
    }
    population.sort((a, b) => a.fitness - b.fitness);

    if (population[0].fitness < lastBestFit) {
      lastBestFit = population[0].fitness;
      bestGA = population[0].copy();
      stagnation = 0;
    } else {
      stagnation++;
    }

    const currMut = stagnation > 20 ? GA_MUT_RATE * 2 : GA_MUT_RATE;
    const newPop: Schedule[] = population.slice(0, GA_ELITE);

    while (newPop.length < GA_POP_SIZE) {
      const tournament1 = [];
      for (let i = 0; i < 3; i++) tournament1.push(population[Math.floor(Math.random() * population.length)]);
      const p1 = tournament1.sort((a, b) => a.fitness - b.fitness)[0];

      const tournament2 = [];
      for (let i = 0; i < 3; i++) tournament2.push(population[Math.floor(Math.random() * population.length)]);
      const p2 = tournament2.sort((a, b) => a.fitness - b.fitness)[0];

      const c1 = Math.floor(Math.random() * coursesList.length);
      const c2 = Math.floor(Math.random() * coursesList.length);
      const [cut1, cut2] = [Math.min(c1, c2), Math.max(c1, c2)];

      const childGenes = [...p1.assignments.slice(0, cut1), ...p2.assignments.slice(cut1, cut2), ...p1.assignments.slice(cut2)];
      const child = new Schedule(childGenes);

      for (const gene of child.assignments) {
        if (Math.random() < currMut) {
          if (Math.random() < 0.5) {
            gene.slot = slotIds[Math.floor(Math.random() * slotIds.length)];
          } else {
            const validRooms = getValidRooms(coursesDict[gene.course_id], roomsDict, roomIds);
            gene.room = validRooms[Math.floor(Math.random() * validRooms.length)];
          }
        }
      }
      newPop.push(child);
    }
    population.splice(0, population.length, ...newPop);
  }

  return bestGA!;
}

function runTabuSearch(
  initialSchedule: Schedule,
  coursesList: Course[],
  slotIds: number[],
  roomsDict: Record<string, Room>,
  coursesDict: Record<string, Course>,
  roomIds: string[]
): Schedule {
  let currentSol = initialSchedule.copy();
  let bestSol = initialSchedule.copy();
  const tabuList: string[] = [];

  for (let iter = 0; iter < TABU_MAX_ITERS; iter++) {
    if (bestSol.hard_count === 0) break;

    const neighborhood: Array<[Schedule, string]> = [];
    const sampledCourses = coursesList.sort(() => 0.5 - Math.random()).slice(0, Math.min(30, coursesList.length));

    for (const course of sampledCourses) {
      for (let i = 0; i < 5; i++) {
        const newSlot = slotIds[Math.floor(Math.random() * slotIds.length)];
        const validRooms = getValidRooms(course, roomsDict, roomIds);
        const newRoom = validRooms[Math.floor(Math.random() * validRooms.length)];
        const move = `${course.course_id}_${newSlot}`;

        if (tabuList.includes(move)) continue;

        const neighbor = currentSol.copy();
        for (const assign of neighbor.assignments) {
          if (assign.course_id === course.course_id) {
            assign.slot = newSlot;
            assign.room = newRoom;
            break;
          }
        }
        calculateFitness(neighbor, roomsDict, coursesDict);
        neighborhood.push([neighbor, move]);
      }
    }

    if (neighborhood.length === 0) continue;

    neighborhood.sort((a, b) => a[0].fitness - b[0].fitness);
    [currentSol] = neighborhood[0];
    const move = neighborhood[0][1];

    if (currentSol.fitness < bestSol.fitness) {
      bestSol = currentSol.copy();
    }

    tabuList.push(move);
    if (tabuList.length > TABU_SIZE) {
      tabuList.shift();
    }
  }

  return bestSol;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: roomsData } = await supabaseClient.from("rooms").select("*");
    const { data: teachersData } = await supabaseClient.from("teachers").select("*");
    const { data: coursesData } = await supabaseClient.from("courses").select("*");

    if (!roomsData || !teachersData || !coursesData) {
      throw new Error("Missing data");
    }

    const coursesList: Course[] = coursesData;
    const timeSlots = getTimeSlots();
    const slotIds = timeSlots.map((s) => s.id);

    const roomsDict: Record<string, Room> = {};
    roomsData.forEach((r) => {
      roomsDict[r.room_id] = r;
    });

    const coursesDict: Record<string, Course> = {};
    coursesData.forEach((c) => {
      coursesDict[c.course_id] = c;
    });

    const roomIds = roomsData.map((r) => r.room_id);

    const gaSol = runGeneticAlgorithm(coursesList, slotIds, roomsDict, coursesDict, roomIds);
    const finalSol = runTabuSearch(gaSol, coursesList, slotIds, roomsDict, coursesDict, roomIds);

    const timestamp = new Date().toLocaleString();
    const { data: savedSchedule } = await supabaseClient
      .from("schedules")
      .insert({
        name: `Schedule ${timestamp}`,
        assignments: finalSol.assignments,
        fitness: finalSol.fitness,
        hard_violations: finalSol.hard_count,
        soft_score: finalSol.soft_score,
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        schedule: savedSchedule,
        stats: {
          fitness: finalSol.fitness,
          hard_violations: finalSol.hard_count,
          soft_score: finalSol.soft_score,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});