import { db } from '../server/db';
import { puzzles } from '../shared/schema';
import { format, addDays } from 'date-fns';

// List of possible emojis for puzzles
const emojiBank = {
  normal: [
    { emojis: ['🧠', '⛈️'], answer: 'brainstorm', hints: ['Think together', 'Mental weather', 'Idea generation'] },
    { emojis: ['🌊', '🏄'], answer: 'wavesurfer', hints: ['Ocean rider', 'Crest glider', 'Water sport'] },
    { emojis: ['🍎', '👁️'], answer: 'eyecandy', hints: ['Visual treat', 'Pleasant sight', 'Looks good'] },
    { emojis: ['🏠', '🐕'], answer: 'housedog', hints: ['Indoor pet', 'Domestic animal', 'Not a yard canine'] },
    { emojis: ['☕', '⏰'], answer: 'wakeuptime', hints: ['Morning ritual', 'Alarm moment', 'Start of day'] },
    { emojis: ['🔥', '📱'], answer: 'hotline', hints: ['Urgent connection', 'Emergency number', 'Direct call'] },
    { emojis: ['🌙', '🌊'], answer: 'moonlight', hints: ['Night glow', 'Lunar rays', 'Evening shine'] },
    { emojis: ['💰', '👑'], answer: 'cashking', hints: ['Wealth ruler', 'Money monarch', 'Finance royalty'] },
    { emojis: ['🍦', '🥶'], answer: 'brainfreeeze', hints: ['Cold headache', 'Ice cream pain', 'Chilly skull'] },
    { emojis: ['🎮', '👾'], answer: 'videogame', hints: ['Digital play', 'Screen entertainment', 'Console activity'] },
    { emojis: ['🌍', '🔄'], answer: 'worldspin', hints: ['Globe rotation', 'Earth turn', 'Planet revolve'] },
    { emojis: ['🔑', '🏠'], answer: 'homekey', hints: ['Door opener', 'House access', 'Residence unlock'] },
    { emojis: ['🍕', '🛋️'], answer: 'couchpotato', hints: ['Lazy person', 'TV watcher', 'Sedentary lifestyle'] },
    { emojis: ['📝', '🏛️'], answer: 'lawschool', hints: ['Legal education', 'Attorney training', 'Judicial learning'] },
    { emojis: ['🚢', '👑'], answer: 'shipcaptain', hints: ['Vessel leader', 'Boat commander', 'Maritime chief'] },
    { emojis: ['💻', '🪲'], answer: 'computerbug', hints: ['Software error', 'Code glitch', 'Program problem'] },
    { emojis: ['🥏', '⚽'], answer: 'frisbeegoal', hints: ['Flying disk score', 'Ultimate target', 'Disc point'] },
    { emojis: ['🎭', '🏛️'], answer: 'theatershow', hints: ['Stage performance', 'Drama play', 'Acting exhibition'] },
    { emojis: ['🎂', '🍓'], answer: 'strawberrydessert', hints: ['Red fruit sweet', 'Berry treat', 'Cake topping'] },
    { emojis: ['☔', '⛱️'], answer: 'raincover', hints: ['Wet protection', 'Shower shield', 'Downpour defense'] }
  ],
  hard: [
    { emojis: ['🌪️', '😴'], answer: 'dreamcatcher', hints: ['Sleep guardian', 'Nightmare filter', 'Bedside hanger'] },
    { emojis: ['🧿', '🧩'], answer: 'mindfulness', hints: ['Present awareness', 'Conscious attention', 'Meditation state'] },
    { emojis: ['🍯', '🐻', '🌲'], answer: 'honeyforest', hints: ['Sweet woods', 'Bear\'s paradise', 'Sticky wilderness'] },
    { emojis: ['🔮', '📊'], answer: 'futureforecast', hints: ['Coming prediction', 'Tomorrow\'s outlook', 'Upcoming projection'] },
    { emojis: ['🔍', '🧠', '🎮'], answer: 'thoughtexperiment', hints: ['Mental scenario', 'Hypothetical thinking', 'Imagination test'] },
    { emojis: ['🌌', '🚀', '🛰️'], answer: 'spaceexploration', hints: ['Cosmic journey', 'Universe discovery', 'Orbital mission'] },
    { emojis: ['💭', '🔄', '⚡'], answer: 'brainstormsession', hints: ['Idea meeting', 'Creative gathering', 'Thought exchange'] },
    { emojis: ['🌱', '🌦️', '🌾'], answer: 'growingseason', hints: ['Plant time', 'Farming period', 'Cultivation months'] },
    { emojis: ['🧪', '🧑‍🔬', '💡'], answer: 'scientificdiscovery', hints: ['Research finding', 'Lab breakthrough', 'Knowledge advancement'] },
    { emojis: ['🔥', '🧱', '🏚️'], answer: 'firewall', hints: ['Flame barrier', 'Heat blocker', 'Burning boundary'] },
    { emojis: ['🎬', '🎭', '🏆'], answer: 'movieperformance', hints: ['Screen acting', 'Film portrayal', 'Cinema role'] },
    { emojis: ['💧', '☀️', '🌈'], answer: 'rainbowformation', hints: ['Color arch', 'Light spectrum', 'After-rain phenomenon'] },
    { emojis: ['🌽', '🚜', '🌱'], answer: 'agriculturaldevelopment', hints: ['Farming growth', 'Crop advancement', 'Rural progress'] },
    { emojis: ['📱', '🔋', '⚡'], answer: 'wirelesscharging', hints: ['Cordless power', 'Contact-free energy', 'Inductive electricity'] },
    { emojis: ['🌍', '🌡️', '📈'], answer: 'globalwarming', hints: ['Earth heating', 'Climate change', 'Temperature rise'] },
    { emojis: ['🧩', '🧠', '🧬'], answer: 'neuroscientificresearch', hints: ['Brain study', 'Mind science', 'Neural investigation'] },
    { emojis: ['🏙️', '💻', '🤖'], answer: 'artificialintelligence', hints: ['Computer thinking', 'Machine learning', 'Synthetic cognition'] },
    { emojis: ['🧘‍♀️', '😌', '🧠'], answer: 'stressmanagement', hints: ['Tension control', 'Anxiety handling', 'Pressure relief'] },
    { emojis: ['🚶‍♂️', '🚶‍♀️', '🌉'], answer: 'pedestrianinfrastructure', hints: ['Walking paths', 'Foot travel systems', 'People-movement structures'] },
    { emojis: ['🧠', '💉', '💊'], answer: 'neuropsychopharmacology', hints: ['Brain medicine', 'Mind drug science', 'Neural chemical study'] }
  ],
  fusion: [
    { 
      emojis: ['🐯', '🦁', '❄️'], 
      answer: 'liontiger', 
      hints: ['Hybrid cat', 'Mixed predator', 'Big feline blend'],
      isFusionTwist: 1,
      twistType: 'Animal Fusion'
    },
    { 
      emojis: ['🍫', '🥜', '🧈'], 
      answer: 'peanutbuttercup', 
      hints: ['Sweet nutty treat', 'Chocolate disk', 'Reese\'s product'],
      isFusionTwist: 1,
      twistType: 'Food Fusion'
    },
    { 
      emojis: ['🔥', '🧊', '⚡'], 
      answer: 'elementblend', 
      hints: ['Mixed powers', 'Combined forces', 'Nature fusion'],
      isFusionTwist: 1,
      twistType: 'Element Fusion'
    },
    { 
      emojis: ['🌞', '🌑', '🌓'], 
      answer: 'solareclipse', 
      hints: ['Shadow event', 'Celestial overlap', 'Sun disappearance'],
      isFusionTwist: 1,
      twistType: 'Celestial Fusion'
    },
    { 
      emojis: ['🎸', '🎹', '🎯'], 
      answer: 'rockandroll', 
      hints: ['Music genre', 'Elvis style', 'Guitar movement'],
      isFusionTwist: 1,
      twistType: 'Music Fusion'
    },
    { 
      emojis: ['🦊', '🦝', '🐶'], 
      answer: 'foxraccooncrossbreed', 
      hints: ['Mixed woodland animals', 'Red and ringtail blend', 'Forest hybrid'],
      isFusionTwist: 1,
      twistType: 'Animal Fusion'
    },
    { 
      emojis: ['🍎', '🥭', '🥝'], 
      answer: 'fruitcombination', 
      hints: ['Mixed produce', 'Blended flavors', 'Multi-fruit medley'],
      isFusionTwist: 1,
      twistType: 'Food Fusion'
    },
    { 
      emojis: ['🎻', '🥁', '🎺'], 
      answer: 'orchestralharmony', 
      hints: ['Multi-instrument blend', 'Symphony fusion', 'Musical integration'],
      isFusionTwist: 1,
      twistType: 'Music Fusion'
    },
    { 
      emojis: ['🏝️', '🏔️', '🌋'], 
      answer: 'islandmountainvolcano', 
      hints: ['Tropical peak', 'Oceanic highland', 'Erupting landmass'],
      isFusionTwist: 1,
      twistType: 'Landscape Fusion'
    },
    { 
      emojis: ['🍕', '🌮', '🥗'], 
      answer: 'italianmexicanfusion', 
      hints: ['International cuisine blend', 'Cross-cultural dish', 'Merged food traditions'],
      isFusionTwist: 1,
      twistType: 'Culinary Fusion'
    }
  ]
};

// Function to generate dates starting from today
function generateFutureDates(count: number): string[] {
  const dates: string[] = [];
  const startDate = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = addDays(startDate, i);
    dates.push(format(date, 'yyyy-MM-dd'));
  }
  
  return dates;
}

// Generate puzzles with a mix of difficulties and fusion twists
async function generatePuzzleTiers() {
  try {
    console.log('Starting to generate puzzle tiers...');
    
    // Generate future dates for the puzzles - generate more for better distribution 
    const dates = generateFutureDates(60);
    const puzzlesList = [];
    
    // Create weekly chunks to ensure fusion puzzles occur twice per week randomly
    for (let weekIndex = 0; weekIndex < Math.floor(dates.length / 7); weekIndex++) {
      // Get the 7 days for this week
      const weekDays = dates.slice(weekIndex * 7, (weekIndex + 1) * 7);
      
      // Pick two random days in this week for fusion puzzles
      const fusionDayIndexes = [];
      while (fusionDayIndexes.length < 2) {
        const randomDay = Math.floor(Math.random() * 7);
        if (!fusionDayIndexes.includes(randomDay)) {
          fusionDayIndexes.push(randomDay);
        }
      }
      
      // For each day in the week
      for (let dayOfWeek = 0; dayOfWeek < weekDays.length; dayOfWeek++) {
        const date = weekDays[dayOfWeek];
        const puzzleNumber = weekIndex * 7 + dayOfWeek + 1;
        
        // If this is a fusion day
        if (fusionDayIndexes.includes(dayOfWeek)) {
          const fusionIndex = Math.floor(Math.random() * emojiBank.fusion.length);
          const { emojis, answer, hints, isFusionTwist, twistType } = emojiBank.fusion[fusionIndex];
          
          puzzlesList.push({
            puzzleNumber,
            date,
            emojis,
            answer,
            hints,
            difficulty: 'normal',
            isFusionTwist, 
            twistType
          });
          
          console.log(`Week ${weekIndex + 1}, Day ${dayOfWeek + 1}: Fusion Twist Puzzle`);
        } 
        // Half of the non-fusion days should be Hard difficulty (adjust according to preference)
        else if (dayOfWeek % 2 === 0) {
          const hardIndex = Math.floor(Math.random() * emojiBank.hard.length);
          const { emojis, answer, hints } = emojiBank.hard[hardIndex];
          
          puzzlesList.push({
            puzzleNumber,
            date,
            emojis,
            answer,
            hints,
            difficulty: 'hard',
            isFusionTwist: 0,
            twistType: null
          });
          
          console.log(`Week ${weekIndex + 1}, Day ${dayOfWeek + 1}: Hard Puzzle`);
        } 
        // The other half are normal puzzles
        else {
          const normalIndex = Math.floor(Math.random() * emojiBank.normal.length);
          const { emojis, answer, hints } = emojiBank.normal[normalIndex];
          
          puzzlesList.push({
            puzzleNumber,
            date,
            emojis,
            answer,
            hints,
            difficulty: 'normal',
            isFusionTwist: 0,
            twistType: null
          });
          
          console.log(`Week ${weekIndex + 1}, Day ${dayOfWeek + 1}: Normal Puzzle`);
        }
      }
    }
    
    // Insert puzzles into the database
    console.log(`Inserting ${puzzlesList.length} puzzles into the database...`);
    
    // First clear existing puzzles
    await db.delete(puzzles);
    
    // Insert new puzzles
    const insertedPuzzles = await db.insert(puzzles).values(puzzlesList).returning();
    
    console.log(`Successfully inserted ${insertedPuzzles.length} puzzles.`);
    
    // Show the first few puzzles as a sample
    console.log('Sample puzzles:');
    insertedPuzzles.slice(0, 5).forEach(puzzle => {
      console.log(`Puzzle #${puzzle.puzzleNumber} (${puzzle.date}): ${puzzle.emojis.join('')} -> ${puzzle.answer} (${puzzle.difficulty}${puzzle.isFusionTwist ? ', ' + puzzle.twistType : ''})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating puzzle tiers:', error);
    process.exit(1);
  }
}

generatePuzzleTiers();