import { Course, Room, Schedule as ScheduleType } from '../types';

// ============================================================
// 0. CONFIGURATION & PARAMÈTRES
// ============================================================
const N_RUNS = 5; // Reduced from 10 to prevent browser freeze, can be increased if needed
const WEIGHT_HARD = 100000;
const WEIGHT_SOFT_GAP = 10;
const WEIGHT_SOFT_BALANCE = 5;
const SLOTS_PER_DAY = 4;

// Paramètres optimisés
const GA_PARAMS = {
    pop_size: 200,
    mut_rate: 0.4,
    elite: 20,
    gens: 120
};

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
    conflicts: number[]; // Indices of assignments causing conflicts

    constructor(assignments: Gene[] = []) {
        this.assignments = assignments;
        this.fitness = Infinity;
        this.hard_count = 0;
        this.soft_score = 0;
        this.conflicts = [];
    }

    copy(): Schedule {
        const newSchedule = new Schedule(JSON.parse(JSON.stringify(this.assignments)));
        newSchedule.fitness = this.fitness;
        newSchedule.hard_count = this.hard_count;
        newSchedule.soft_score = this.soft_score;
        newSchedule.conflicts = [...this.conflicts];
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

// ============================================================
// 1. LOGIQUE MÉTIER & FITNESS
// ============================================================

function getValidRooms(course: Course, roomsDict: Record<string, Room>, allRoomIds: string[]): string[] {
    const reqType = course.room_type_req;
    const reqSize = Number(course.group_size);
    const valid: string[] = [];

    for (const rid of allRoomIds) {
        const r = roomsDict[rid];
        if (r.capacity < reqSize) continue;

        if (reqType === 'cycle' && r.type === 'cycle') valid.push(rid);
        else if (reqType === 'AMPHI' && r.type === 'AMPHI') valid.push(rid);
        else if (['cour', 'TD'].includes(reqType) && ['cour', 'TD', 'AMPHI'].includes(r.type)) valid.push(rid);
        // Fallback for exact match if not covered above
        else if (reqType === r.type) valid.push(rid);
    }

    return valid.length > 0 ? valid : allRoomIds;
}

function calculateFitness(
    schedule: Schedule,
    roomsDict: Record<string, Room>,
    coursesDict: Record<string, Course>
): number {
    let hardViolations = 0;
    let softPenalty = 0;
    schedule.conflicts = [];

    const teacherSlots: Record<string, boolean> = {};
    const roomSlots: Record<string, boolean> = {};
    const groupSlots: Record<string, boolean> = {};
    const groupDailySchedule: Record<string, Record<number, number[]>> = {};

    schedule.assignments.forEach((gene, idx) => {
        const course = coursesDict[gene.course_id];
        const room = roomsDict[gene.room];
        const slot = gene.slot;

        let isHardViolated = false;

        // --- HARD CONSTRAINTS ---
        if (Number(course.group_size) > Number(room.capacity)) {
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

        if (isHardViolated) {
            hardViolations++;
            schedule.conflicts.push(idx); // Crucial pour Smart Repair
        }

        // --- SOFT CONSTRAINTS ---
        const dayIdx = Math.floor(slot / SLOTS_PER_DAY);
        if (!groupDailySchedule[course.group_id]) groupDailySchedule[course.group_id] = {};
        if (!groupDailySchedule[course.group_id][dayIdx]) groupDailySchedule[course.group_id][dayIdx] = [];
        groupDailySchedule[course.group_id][dayIdx].push(slot);
    });

    for (const grp in groupDailySchedule) {
        for (const day in groupDailySchedule[grp]) {
            const slots = groupDailySchedule[grp][day].sort((a, b) => a - b);
            if (slots.length > 1) {
                const holes = Math.max(0, (slots[slots.length - 1] - slots[0]) - (slots.length - 1));
                softPenalty += holes * WEIGHT_SOFT_GAP;
            }
            if (slots.length > 3) {
                softPenalty += WEIGHT_SOFT_BALANCE;
            }
        }
    }

    schedule.hard_count = hardViolations;
    schedule.soft_score = softPenalty;
    schedule.fitness = (hardViolations * WEIGHT_HARD) + softPenalty;
    return schedule.fitness;
}

// ============================================================
// 2. ALGORITHME GÉNÉTIQUE (AVEC SMART REPAIR)
// ============================================================

function smartMutation(
    schedule: Schedule,
    slotIds: number[],
    roomsDict: Record<string, Room>,
    coursesDict: Record<string, Course>,
    roomIds: string[]
) {
    let idx: number;
    if (schedule.conflicts.length > 0) {
        idx = schedule.conflicts[Math.floor(Math.random() * schedule.conflicts.length)];
    } else {
        idx = Math.floor(Math.random() * schedule.assignments.length);
    }

    const gene = schedule.assignments[idx];
    const course = coursesDict[gene.course_id];

    if (Math.random() < 0.6) {
        gene.slot = slotIds[Math.floor(Math.random() * slotIds.length)];
    } else {
        const validRooms = getValidRooms(course, roomsDict, roomIds);
        gene.room = validRooms[Math.floor(Math.random() * validRooms.length)];
    }
}

async function runGeneticAlgorithm(
    coursesList: Course[],
    slotIds: number[],
    roomsDict: Record<string, Room>,
    coursesDict: Record<string, Course>,
    roomIds: string[]
): Promise<Schedule> {
    const { pop_size, mut_rate, elite, gens } = GA_PARAMS;

    // Initialisation
    let population: Schedule[] = [];
    for (let i = 0; i < pop_size; i++) {
        const genes: Gene[] = coursesList.map((c) => ({
            course_id: c.course_id,
            slot: slotIds[Math.floor(Math.random() * slotIds.length)],
            room: getValidRooms(c, roomsDict, roomIds)[Math.floor(Math.random() * getValidRooms(c, roomsDict, roomIds).length)],
        }));
        population.push(new Schedule(genes));
    }

    for (const s of population) calculateFitness(s, roomsDict, coursesDict);

    let bestGA = population[0].copy();

    for (let gen = 0; gen < gens; gen++) {
        // Yield control to UI every few generations
        if (gen % 10 === 0) await new Promise(r => setTimeout(r, 0));

        population.sort((a, b) => a.fitness - b.fitness);

        if (population[0].fitness < bestGA.fitness) {
            bestGA = population[0].copy();
        }

        // Arrêt anticipé si parfait
        if (population[0].hard_count === 0 && population[0].soft_score < 50) {
            return population[0];
        }

        const newPop: Schedule[] = population.slice(0, elite);
        const top40 = population.slice(0, 40);

        while (newPop.length < pop_size) {
            // Tournament selection from top 40
            const tournament = [];
            for (let i = 0; i < 3; i++) tournament.push(top40[Math.floor(Math.random() * top40.length)]);
            const p1 = tournament.sort((a, b) => a.fitness - b.fitness)[0];

            const child = p1.copy(); // Reproduction asexuée

            if (Math.random() < mut_rate) {
                const repeats = child.hard_count > 0 ? 2 : 1;
                for (let i = 0; i < repeats; i++) {
                    smartMutation(child, slotIds, roomsDict, coursesDict, roomIds);
                }
            }
            newPop.push(child);
        }
        population = newPop;
        for (const s of population) calculateFitness(s, roomsDict, coursesDict);
    }

    return bestGA;
}

// ============================================================
// 3. RECHERCHE TABOU (OPTIMISATION FINALE)
// ============================================================

async function runTabuSearch(
    initialSchedule: Schedule,
    coursesList: Course[],
    slotIds: number[],
    roomsDict: Record<string, Room>,
    coursesDict: Record<string, Course>,
    roomIds: string[]
): Promise<Schedule> {
    const MAX_ITERS = 300;
    const TABU_SIZE = 40;

    let currentSol = initialSchedule.copy();
    let bestSol = initialSchedule.copy();
    const tabuList: string[] = [];

    for (let iter = 0; iter < MAX_ITERS; iter++) {
        // Yield control occasionally
        if (iter % 50 === 0) await new Promise(r => setTimeout(r, 0));

        if (bestSol.hard_count === 0 && bestSol.soft_score === 0) break;

        const neighborhood: Schedule[] = [];
        let targets: number[] = [];

        if (currentSol.conflicts.length > 0) {
            targets = currentSol.conflicts.slice(0, 10);
        } else {
            // Sample random indices
            const indices = Array.from({ length: coursesList.length }, (_, i) => i);
            for (let i = 0; i < 5; i++) {
                const randIdx = Math.floor(Math.random() * indices.length);
                targets.push(indices[randIdx]);
                indices.splice(randIdx, 1);
            }
        }

        for (const idx of targets) {
            const gene = currentSol.assignments[idx];
            const cId = gene.course_id;

            // Test 5 neighbors
            for (let i = 0; i < 5; i++) {
                const ns = slotIds[Math.floor(Math.random() * slotIds.length)];
                if (tabuList.includes(`${cId}_${ns}`)) continue;

                const nb = currentSol.copy();
                nb.assignments[idx].slot = ns;

                if (Math.random() > 0.5) {
                    const validRooms = getValidRooms(coursesDict[cId], roomsDict, roomIds);
                    nb.assignments[idx].room = validRooms[Math.floor(Math.random() * validRooms.length)];
                }

                calculateFitness(nb, roomsDict, coursesDict);
                neighborhood.push(nb);
            }
        }

        if (neighborhood.length === 0) continue;

        neighborhood.sort((a, b) => a.fitness - b.fitness);
        const bestNeighbor = neighborhood[0];

        currentSol = bestNeighbor;
        if (currentSol.fitness < bestSol.fitness) {
            bestSol = currentSol.copy();
        }

        // Add to Tabu list
        if (targets.length > 0) {
            // We just pick the first target's move to tabu, simplified logic
            // Ideally we track which move created bestNeighbor
            // Here we assume bestNeighbor came from one of the modifications. 
            // Since we don't easily track which specific move created bestNeighbor in this structure without extra return values,
            // we'll just tabu the move of the first assignment that changed.
            for (let i = 0; i < currentSol.assignments.length; i++) {
                if (currentSol.assignments[i].slot !== initialSchedule.assignments[i].slot ||
                    currentSol.assignments[i].room !== initialSchedule.assignments[i].room) {
                    // This is a bit loose, but sufficient for this port
                    const move = `${currentSol.assignments[i].course_id}_${currentSol.assignments[i].slot}`;
                    tabuList.push(move);
                    break;
                }
            }

            if (tabuList.length > TABU_SIZE) tabuList.shift();
        }
    }

    return bestSol;
}

// ============================================================
// 4. EXECUTION PRINCIPALE
// ============================================================

export async function optimizeScheduleLocally(
    coursesData: Course[],
    roomsData: Room[]
): Promise<ScheduleType> {
    // Initial delay to render UI
    await new Promise(resolve => setTimeout(resolve, 100));

    const coursesList = coursesData;
    const timeSlots = getTimeSlots();
    const slotIds = timeSlots.map((s) => s.id);

    const roomsDict: Record<string, Room> = {};
    roomsData.forEach((r) => roomsDict[r.room_id] = r);

    const coursesDict: Record<string, Course> = {};
    coursesData.forEach((c) => coursesDict[c.course_id] = c);

    // Mock Teachers Dict (since we don't strictly need it for fitness logic here other than keys, 
    // but the original code used it. We can infer teacher IDs from courses)
    // Actually, calculateFitness uses it for logging? No, just keys.
    // The Python code passed teachers_dict but only used it for HTML reporting.
    // We can ignore it for optimization core.

    const roomIds = roomsData.map((r) => r.room_id);

    let bestOverall: Schedule | null = null;

    console.log(`🚀 DÉMARRAGE DE L'ANALYSE STATISTIQUE (${N_RUNS} RUNS)`);

    for (let run = 1; run <= N_RUNS; run++) {
        const start = performance.now();

        // 1. GA
        const gaSol = await runGeneticAlgorithm(coursesList, slotIds, roomsDict, coursesDict, roomIds);

        // 2. Tabu
        const finalSol = await runTabuSearch(gaSol, coursesList, slotIds, roomsDict, coursesDict, roomIds);

        const dur = (performance.now() - start) / 1000;

        if (!bestOverall || finalSol.fitness < bestOverall.fitness) {
            bestOverall = finalSol.copy();
        }

        const status = finalSol.hard_count === 0 ? "✅ CLEAN" : `❌ ${finalSol.hard_count} ERR`;
        console.log(`Run ${run.toString().padStart(2, '0')} | ${status} | Fitness: ${finalSol.fitness.toFixed(0)} | Temps: ${dur.toFixed(1)}s`);

        // Yield between runs
        await new Promise(r => setTimeout(r, 50));
    }

    if (!bestOverall) throw new Error("Optimization failed to produce a result.");

    console.log("📊 RÉSULTATS FINAUX");
    console.log(`Meilleure Fitness: ${bestOverall.fitness}`);

    const timestamp = new Date().toLocaleString();

    return {
        name: `Schedule (Optimized) ${timestamp}`,
        assignments: bestOverall.assignments,
        fitness: bestOverall.fitness,
        hard_violations: bestOverall.hard_count,
        soft_score: bestOverall.soft_score,
    } as ScheduleType;
}
