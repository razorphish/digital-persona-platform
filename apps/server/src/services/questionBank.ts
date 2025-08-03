/**
 * Static Question Bank for Airica Intelligence System
 * 
 * Contains 100 carefully crafted questions distributed across relationship stages.
 * Used as fallback when OpenAI API is unavailable or rate-limited.
 */

export interface Question {
  id: string;
  question: string;
  category: string;
  intimacyLevel: number; // 1-10 scale
  stage: 'stranger' | 'acquaintance' | 'friend' | 'close_friend';
  tags: string[];
}

export interface QuestionCategory {
  name: string;
  description: string;
  questions: Question[];
}

export interface RelationshipStage {
  stage: 'stranger' | 'acquaintance' | 'friend' | 'close_friend';
  messageThreshold: number;
  intimacyRange: [number, number];
  categories: QuestionCategory[];
}

// Static Question Bank - 100 questions distributed across relationship stages
export const QUESTION_BANK: Record<string, RelationshipStage> = {
  stranger: {
    stage: 'stranger',
    messageThreshold: 0,
    intimacyRange: [1, 3],
    categories: [
      {
        name: 'light',
        description: 'Casual, surface-level questions',
        questions: [
          {
            id: 'str_light_01',
            question: "What's your favorite way to spend a weekend?",
            category: 'light',
            intimacyLevel: 1,
            stage: 'stranger',
            tags: ['lifestyle', 'preferences', 'leisure']
          },
          {
            id: 'str_light_02',
            question: "Are you more of a morning person or a night owl?",
            category: 'light',
            intimacyLevel: 1,
            stage: 'stranger',
            tags: ['habits', 'personality', 'routine']
          },
          {
            id: 'str_light_03',
            question: "What's the best meal you've had recently?",
            category: 'light',
            intimacyLevel: 1,
            stage: 'stranger',
            tags: ['food', 'experiences', 'recent']
          },
          {
            id: 'str_light_04',
            question: "Do you prefer the city or the countryside?",
            category: 'light',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['environment', 'preferences', 'lifestyle']
          },
          {
            id: 'str_light_05',
            question: "What's your go-to comfort activity when you're stressed?",
            category: 'light',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['coping', 'stress', 'self-care']
          }
        ]
      },
      {
        name: 'preferences',
        description: 'Likes, dislikes, favorites',
        questions: [
          {
            id: 'str_pref_01',
            question: "What genre of music do you find yourself listening to most?",
            category: 'preferences',
            intimacyLevel: 1,
            stage: 'stranger',
            tags: ['music', 'entertainment', 'taste']
          },
          {
            id: 'str_pref_02',
            question: "Coffee or tea? And how do you like it prepared?",
            category: 'preferences',
            intimacyLevel: 1,
            stage: 'stranger',
            tags: ['beverages', 'habits', 'routine']
          },
          {
            id: 'str_pref_03',
            question: "What's your favorite season and why?",
            category: 'preferences',
            intimacyLevel: 1,
            stage: 'stranger',
            tags: ['seasons', 'nature', 'emotions']
          },
          {
            id: 'str_pref_04',
            question: "Do you prefer watching movies or reading books?",
            category: 'preferences',
            intimacyLevel: 1,
            stage: 'stranger',
            tags: ['entertainment', 'media', 'leisure']
          },
          {
            id: 'str_pref_05',
            question: "What's your favorite way to stay active or exercise?",
            category: 'preferences',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['fitness', 'health', 'activities']
          }
        ]
      },
      {
        name: 'surface',
        description: 'Safe personal topics',
        questions: [
          {
            id: 'str_surf_01',
            question: "What's something you've learned recently that surprised you?",
            category: 'surface',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['learning', 'growth', 'curiosity']
          },
          {
            id: 'str_surf_02',
            question: "What's your favorite app on your phone and why?",
            category: 'surface',
            intimacyLevel: 1,
            stage: 'stranger',
            tags: ['technology', 'habits', 'utility']
          },
          {
            id: 'str_surf_03',
            question: "If you could master any skill instantly, what would it be?",
            category: 'surface',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['aspirations', 'skills', 'interests']
          },
          {
            id: 'str_surf_04',
            question: "What's the most interesting place you've visited?",
            category: 'surface',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['travel', 'experiences', 'places']
          },
          {
            id: 'str_surf_05',
            question: "What's something that always makes you smile?",
            category: 'surface',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['happiness', 'joy', 'positive']
          }
        ]
      },
      {
        name: 'hobbies',
        description: 'Activities and interests',
        questions: [
          {
            id: 'str_hobb_01',
            question: "What's a hobby you've been wanting to try?",
            category: 'hobbies',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['interests', 'aspirations', 'activities']
          },
          {
            id: 'str_hobb_02',
            question: "Do you have any creative outlets or artistic interests?",
            category: 'hobbies',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['creativity', 'art', 'expression']
          },
          {
            id: 'str_hobb_03',
            question: "What's something you do that helps you unwind?",
            category: 'hobbies',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['relaxation', 'stress-relief', 'personal-time']
          },
          {
            id: 'str_hobb_04',
            question: "Are you into any sports, either playing or watching?",
            category: 'hobbies',
            intimacyLevel: 1,
            stage: 'stranger',
            tags: ['sports', 'competition', 'entertainment']
          },
          {
            id: 'str_hobb_05',
            question: "What's the last thing you got really excited about?",
            category: 'hobbies',
            intimacyLevel: 3,
            stage: 'stranger',
            tags: ['excitement', 'passion', 'enthusiasm']
          }
        ]
      },
      {
        name: 'daily_life',
        description: 'Routine and lifestyle',
        questions: [
          {
            id: 'str_daily_01',
            question: "What does a typical day look like for you?",
            category: 'daily_life',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['routine', 'schedule', 'lifestyle']
          },
          {
            id: 'str_daily_02',
            question: "What's your favorite part of your daily routine?",
            category: 'daily_life',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['routine', 'preferences', 'satisfaction']
          },
          {
            id: 'str_daily_03',
            question: "How do you usually start your mornings?",
            category: 'daily_life',
            intimacyLevel: 1,
            stage: 'stranger',
            tags: ['morning', 'routine', 'habits']
          },
          {
            id: 'str_daily_04',
            question: "What's something you do every day that brings you joy?",
            category: 'daily_life',
            intimacyLevel: 3,
            stage: 'stranger',
            tags: ['joy', 'daily-habits', 'happiness']
          },
          {
            id: 'str_daily_05',
            question: "Do you have any evening rituals or ways to wind down?",
            category: 'daily_life',
            intimacyLevel: 2,
            stage: 'stranger',
            tags: ['evening', 'relaxation', 'routine']
          }
        ]
      }
    ]
  },

  acquaintance: {
    stage: 'acquaintance',
    messageThreshold: 10,
    intimacyRange: [3, 6],
    categories: [
      {
        name: 'personal',
        description: 'Personal experiences',
        questions: [
          {
            id: 'acq_pers_01',
            question: "What's something you're really proud of accomplishing?",
            category: 'personal',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['achievement', 'pride', 'accomplishment']
          },
          {
            id: 'acq_pers_02',
            question: "What's a challenge you've overcome that changed your perspective?",
            category: 'personal',
            intimacyLevel: 5,
            stage: 'acquaintance',
            tags: ['challenges', 'growth', 'perspective']
          },
          {
            id: 'acq_pers_03',
            question: "What's something about yourself that people might find surprising?",
            category: 'personal',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['surprising', 'personality', 'hidden-traits']
          },
          {
            id: 'acq_pers_04',
            question: "What's a skill you have that you don't often get to use?",
            category: 'personal',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['skills', 'talents', 'unused-abilities']
          },
          {
            id: 'acq_pers_05',
            question: "What's something you've learned about yourself recently?",
            category: 'personal',
            intimacyLevel: 5,
            stage: 'acquaintance',
            tags: ['self-discovery', 'learning', 'growth']
          }
        ]
      },
      {
        name: 'experiences',
        description: 'Life experiences',
        questions: [
          {
            id: 'acq_exp_01',
            question: "What's the most adventurous thing you've ever done?",
            category: 'experiences',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['adventure', 'risk', 'excitement']
          },
          {
            id: 'acq_exp_02',
            question: "What's a moment in your life that felt like a turning point?",
            category: 'experiences',
            intimacyLevel: 6,
            stage: 'acquaintance',
            tags: ['turning-point', 'life-change', 'pivotal']
          },
          {
            id: 'acq_exp_03',
            question: "What's the kindest thing someone has ever done for you?",
            category: 'experiences',
            intimacyLevel: 5,
            stage: 'acquaintance',
            tags: ['kindness', 'gratitude', 'relationships']
          },
          {
            id: 'acq_exp_04',
            question: "What's an experience that completely exceeded your expectations?",
            category: 'experiences',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['expectations', 'surprise', 'positive']
          },
          {
            id: 'acq_exp_05',
            question: "What's something you thought you'd never do, but ended up trying?",
            category: 'experiences',
            intimacyLevel: 5,
            stage: 'acquaintance',
            tags: ['unexpected', 'trying-new-things', 'growth']
          }
        ]
      },
      {
        name: 'opinions',
        description: 'Views and perspectives',
        questions: [
          {
            id: 'acq_opin_01',
            question: "What's something you believe that others might disagree with?",
            category: 'opinions',
            intimacyLevel: 5,
            stage: 'acquaintance',
            tags: ['beliefs', 'controversy', 'personal-views']
          },
          {
            id: 'acq_opin_02',
            question: "What's a piece of advice you'd give to your younger self?",
            category: 'opinions',
            intimacyLevel: 5,
            stage: 'acquaintance',
            tags: ['advice', 'wisdom', 'reflection']
          },
          {
            id: 'acq_opin_03',
            question: "What do you think is the most important quality in a person?",
            category: 'opinions',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['values', 'character', 'importance']
          },
          {
            id: 'acq_opin_04',
            question: "What's something you wish more people understood about the world?",
            category: 'opinions',
            intimacyLevel: 5,
            stage: 'acquaintance',
            tags: ['understanding', 'perspective', 'world-view']
          },
          {
            id: 'acq_opin_05',
            question: "What's a topic you could talk about for hours?",
            category: 'opinions',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['passion', 'interests', 'enthusiasm']
          }
        ]
      },
      {
        name: 'memories',
        description: 'Past events and stories',
        questions: [
          {
            id: 'acq_mem_01',
            question: "What's your favorite childhood memory?",
            category: 'memories',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['childhood', 'nostalgia', 'happy-memories']
          },
          {
            id: 'acq_mem_02',
            question: "What's a memory that always makes you laugh?",
            category: 'memories',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['humor', 'laughter', 'funny-memories']
          },
          {
            id: 'acq_mem_03',
            question: "What's the most memorable gift you've ever received?",
            category: 'memories',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['gifts', 'memorable', 'thoughtfulness']
          },
          {
            id: 'acq_mem_04',
            question: "What's a tradition or holiday that's special to you?",
            category: 'memories',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['traditions', 'holidays', 'family']
          },
          {
            id: 'acq_mem_05',
            question: "What's a small moment that left a big impact on you?",
            category: 'memories',
            intimacyLevel: 6,
            stage: 'acquaintance',
            tags: ['impact', 'meaningful', 'pivotal-moments']
          }
        ]
      },
      {
        name: 'goals',
        description: 'Aspirations and plans',
        questions: [
          {
            id: 'acq_goal_01',
            question: "What's something you're working towards right now?",
            category: 'goals',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['current-goals', 'progress', 'ambition']
          },
          {
            id: 'acq_goal_02',
            question: "What's a dream you've had since you were young?",
            category: 'goals',
            intimacyLevel: 5,
            stage: 'acquaintance',
            tags: ['dreams', 'long-term', 'childhood-dreams']
          },
          {
            id: 'acq_goal_03',
            question: "What's something you want to learn or improve about yourself?",
            category: 'goals',
            intimacyLevel: 5,
            stage: 'acquaintance',
            tags: ['self-improvement', 'learning', 'growth']
          },
          {
            id: 'acq_goal_04',
            question: "Where do you see yourself in five years?",
            category: 'goals',
            intimacyLevel: 4,
            stage: 'acquaintance',
            tags: ['future', 'planning', 'vision']
          },
          {
            id: 'acq_goal_05',
            question: "What's something you want to experience before you're too old?",
            category: 'goals',
            intimacyLevel: 5,
            stage: 'acquaintance',
            tags: ['bucket-list', 'experiences', 'time-sensitive']
          }
        ]
      }
    ]
  },

  friend: {
    stage: 'friend',
    messageThreshold: 50,
    intimacyRange: [6, 8],
    categories: [
      {
        name: 'deeper',
        description: 'More personal topics',
        questions: [
          {
            id: 'fri_deep_01',
            question: "What's something you've never told anyone before?",
            category: 'deeper',
            intimacyLevel: 8,
            stage: 'friend',
            tags: ['secrets', 'private', 'trust']
          },
          {
            id: 'fri_deep_02',
            question: "What's your biggest insecurity, and how do you deal with it?",
            category: 'deeper',
            intimacyLevel: 7,
            stage: 'friend',
            tags: ['insecurity', 'vulnerability', 'coping']
          },
          {
            id: 'fri_deep_03',
            question: "What's a mistake you made that taught you the most about yourself?",
            category: 'deeper',
            intimacyLevel: 7,
            stage: 'friend',
            tags: ['mistakes', 'learning', 'self-awareness']
          },
          {
            id: 'fri_deep_04',
            question: "What do you do when you feel completely overwhelmed?",
            category: 'deeper',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['overwhelm', 'coping', 'stress-management']
          },
          {
            id: 'fri_deep_05',
            question: "What's something about your personality that you're still figuring out?",
            category: 'deeper',
            intimacyLevel: 7,
            stage: 'friend',
            tags: ['self-discovery', 'personality', 'confusion']
          }
        ]
      },
      {
        name: 'emotional',
        description: 'Feelings and emotions',
        questions: [
          {
            id: 'fri_emot_01',
            question: "What makes you feel most alive and energized?",
            category: 'emotional',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['energy', 'passion', 'vitality']
          },
          {
            id: 'fri_emot_02',
            question: "What's something that brings you to tears, either sad or happy?",
            category: 'emotional',
            intimacyLevel: 7,
            stage: 'friend',
            tags: ['tears', 'emotional-triggers', 'sensitivity']
          },
          {
            id: 'fri_emot_03',
            question: "When was the last time you felt truly content and at peace?",
            category: 'emotional',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['contentment', 'peace', 'satisfaction']
          },
          {
            id: 'fri_emot_04',
            question: "What emotion do you struggle with the most?",
            category: 'emotional',
            intimacyLevel: 7,
            stage: 'friend',
            tags: ['struggle', 'difficult-emotions', 'challenges']
          },
          {
            id: 'fri_emot_05',
            question: "What's something that always restores your faith in humanity?",
            category: 'emotional',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['faith', 'humanity', 'hope']
          }
        ]
      },
      {
        name: 'relationships',
        description: 'Family, friends, romantic',
        questions: [
          {
            id: 'fri_rel_01',
            question: "What's the most important lesson you've learned about relationships?",
            category: 'relationships',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['relationships', 'lessons', 'wisdom']
          },
          {
            id: 'fri_rel_02',
            question: "Who has had the biggest impact on who you are today?",
            category: 'relationships',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['influence', 'impact', 'important-people']
          },
          {
            id: 'fri_rel_03',
            question: "What do you value most in your friendships?",
            category: 'relationships',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['friendship', 'values', 'connection']
          },
          {
            id: 'fri_rel_04',
            question: "What's something you wish you could say to someone from your past?",
            category: 'relationships',
            intimacyLevel: 7,
            stage: 'friend',
            tags: ['past', 'regret', 'unfinished-business']
          },
          {
            id: 'fri_rel_05',
            question: "How do you show love and care to the people who matter to you?",
            category: 'relationships',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['love', 'care', 'expression']
          }
        ]
      },
      {
        name: 'challenges',
        description: 'Difficulties and obstacles',
        questions: [
          {
            id: 'fri_chal_01',
            question: "What's the hardest thing you've ever had to do?",
            category: 'challenges',
            intimacyLevel: 7,
            stage: 'friend',
            tags: ['difficulty', 'hardship', 'perseverance']
          },
          {
            id: 'fri_chal_02',
            question: "What's a fear you're working on overcoming?",
            category: 'challenges',
            intimacyLevel: 7,
            stage: 'friend',
            tags: ['fear', 'overcoming', 'courage']
          },
          {
            id: 'fri_chal_03',
            question: "What's something difficult that you're grateful for now?",
            category: 'challenges',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['difficulty', 'gratitude', 'perspective']
          },
          {
            id: 'fri_chal_04',
            question: "What keeps you going when things get really tough?",
            category: 'challenges',
            intimacyLevel: 7,
            stage: 'friend',
            tags: ['motivation', 'resilience', 'perseverance']
          },
          {
            id: 'fri_chal_05',
            question: "What's a challenge you're facing right now that you could use support with?",
            category: 'challenges',
            intimacyLevel: 8,
            stage: 'friend',
            tags: ['current-challenges', 'support', 'vulnerability']
          }
        ]
      },
      {
        name: 'values',
        description: 'Core beliefs and principles',
        questions: [
          {
            id: 'fri_val_01',
            question: "What principle do you never compromise on?",
            category: 'values',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['principles', 'integrity', 'non-negotiable']
          },
          {
            id: 'fri_val_02',
            question: "What does success mean to you personally?",
            category: 'values',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['success', 'personal-definition', 'values']
          },
          {
            id: 'fri_val_03',
            question: "What's something you believe in that guides your decisions?",
            category: 'values',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['beliefs', 'guidance', 'decision-making']
          },
          {
            id: 'fri_val_04',
            question: "What do you think is the purpose of life?",
            category: 'values',
            intimacyLevel: 7,
            stage: 'friend',
            tags: ['purpose', 'life-philosophy', 'meaning']
          },
          {
            id: 'fri_val_05',
            question: "What legacy do you want to leave behind?",
            category: 'values',
            intimacyLevel: 6,
            stage: 'friend',
            tags: ['legacy', 'impact', 'long-term-thinking']
          }
        ]
      }
    ]
  },

  close_friend: {
    stage: 'close_friend',
    messageThreshold: 150,
    intimacyRange: [8, 10],
    categories: [
      {
        name: 'intimate',
        description: 'Very personal topics',
        questions: [
          {
            id: 'cf_inti_01',
            question: "What's your deepest, most personal dream that you've never shared?",
            category: 'intimate',
            intimacyLevel: 9,
            stage: 'close_friend',
            tags: ['dreams', 'personal', 'private']
          },
          {
            id: 'cf_inti_02',
            question: "What's something about your body or mind that you're insecure about?",
            category: 'intimate',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['insecurity', 'body', 'mind']
          },
          {
            id: 'cf_inti_03',
            question: "What's a secret you've kept that weighs on you?",
            category: 'intimate',
            intimacyLevel: 9,
            stage: 'close_friend',
            tags: ['secrets', 'weight', 'burden']
          },
          {
            id: 'cf_inti_04',
            question: "What do you do when you're completely alone that no one knows about?",
            category: 'intimate',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['privacy', 'alone-time', 'personal-habits']
          },
          {
            id: 'cf_inti_05',
            question: "What part of your life do you feel most misunderstood about?",
            category: 'intimate',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['misunderstood', 'isolation', 'complexity']
          }
        ]
      },
      {
        name: 'life_philosophy',
        description: 'Deep beliefs about life',
        questions: [
          {
            id: 'cf_phil_01',
            question: "What do you think happens after we die?",
            category: 'life_philosophy',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['death', 'afterlife', 'spirituality']
          },
          {
            id: 'cf_phil_02',
            question: "What's the most profound realization you've had about existence?",
            category: 'life_philosophy',
            intimacyLevel: 9,
            stage: 'close_friend',
            tags: ['existence', 'profound', 'realization']
          },
          {
            id: 'cf_phil_03',
            question: "How has your understanding of love evolved throughout your life?",
            category: 'life_philosophy',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['love', 'evolution', 'understanding']
          },
          {
            id: 'cf_phil_04',
            question: "What do you think is the root of human suffering?",
            category: 'life_philosophy',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['suffering', 'human-nature', 'philosophy']
          },
          {
            id: 'cf_phil_05',
            question: "If you could know one truth about the universe, what would it be?",
            category: 'life_philosophy',
            intimacyLevel: 9,
            stage: 'close_friend',
            tags: ['truth', 'universe', 'curiosity']
          }
        ]
      },
      {
        name: 'secrets',
        description: 'Private thoughts and experiences',
        questions: [
          {
            id: 'cf_secr_01',
            question: "What's something you've done that you've never forgiven yourself for?",
            category: 'secrets',
            intimacyLevel: 9,
            stage: 'close_friend',
            tags: ['guilt', 'forgiveness', 'regret']
          },
          {
            id: 'cf_secr_02',
            question: "What's your most embarrassing memory that still makes you cringe?",
            category: 'secrets',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['embarrassment', 'cringe', 'vulnerability']
          },
          {
            id: 'cf_secr_03',
            question: "What's a thought you have that you think others would judge you for?",
            category: 'secrets',
            intimacyLevel: 9,
            stage: 'close_friend',
            tags: ['judgment', 'thoughts', 'shame']
          },
          {
            id: 'cf_secr_04',
            question: "What's something you pretend to be that you're not?",
            category: 'secrets',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['pretending', 'authenticity', 'facade']
          },
          {
            id: 'cf_secr_05',
            question: "What's a desire you have that you're ashamed of?",
            category: 'secrets',
            intimacyLevel: 9,
            stage: 'close_friend',
            tags: ['desire', 'shame', 'hidden-wants']
          }
        ]
      },
      {
        name: 'fears',
        description: 'Anxieties and concerns',
        questions: [
          {
            id: 'cf_fear_01',
            question: "What's your biggest fear about your future?",
            category: 'fears',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['future', 'fear', 'anxiety']
          },
          {
            id: 'cf_fear_02',
            question: "What's something that terrifies you that most people wouldn't understand?",
            category: 'fears',
            intimacyLevel: 9,
            stage: 'close_friend',
            tags: ['terror', 'misunderstood', 'unique-fears']
          },
          {
            id: 'cf_fear_03',
            question: "What are you most afraid of losing?",
            category: 'fears',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['loss', 'attachment', 'fear']
          },
          {
            id: 'cf_fear_04',
            question: "What's a fear from childhood that still affects you today?",
            category: 'fears',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['childhood', 'fear', 'lasting-impact']
          },
          {
            id: 'cf_fear_05',
            question: "What do you worry about that you can't control?",
            category: 'fears',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['worry', 'control', 'anxiety']
          }
        ]
      },
      {
        name: 'dreams',
        description: 'Deepest aspirations and hopes',
        questions: [
          {
            id: 'cf_drea_01',
            question: "What's a dream you've given up on that you wish you could pursue again?",
            category: 'dreams',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['abandoned-dreams', 'regret', 'hope']
          },
          {
            id: 'cf_drea_02',
            question: "If you could live one other person's life, whose would it be and why?",
            category: 'dreams',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['other-lives', 'admiration', 'wishes']
          },
          {
            id: 'cf_drea_03',
            question: "What would you do if you knew you couldn't fail?",
            category: 'dreams',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['no-failure', 'boldness', 'dreams']
          },
          {
            id: 'cf_drea_04',
            question: "What's something you fantasize about that feels impossible?",
            category: 'dreams',
            intimacyLevel: 9,
            stage: 'close_friend',
            tags: ['fantasy', 'impossible', 'desires']
          },
          {
            id: 'cf_drea_05',
            question: "How do you want to be remembered by the people who love you?",
            category: 'dreams',
            intimacyLevel: 8,
            stage: 'close_friend',
            tags: ['remembrance', 'love', 'legacy']
          }
        ]
      }
    ]
  }
};

export class QuestionBankService {
  /**
   * Get all questions for a specific relationship stage
   */
  static getQuestionsForStage(stage: 'stranger' | 'acquaintance' | 'friend' | 'close_friend'): Question[] {
    const stageData = QUESTION_BANK[stage];
    return stageData.categories.flatMap(category => category.questions);
  }

  /**
   * Get a random question for a specific stage and category
   */
  static getRandomQuestion(
    stage: 'stranger' | 'acquaintance' | 'friend' | 'close_friend',
    category?: string,
    excludeIds: string[] = []
  ): Question | null {
    const stageData = QUESTION_BANK[stage];
    let questions: Question[] = [];

    if (category) {
      const categoryData = stageData.categories.find(c => c.name === category);
      if (!categoryData) return null;
      questions = categoryData.questions;
    } else {
      questions = stageData.categories.flatMap(c => c.questions);
    }

    // Filter out excluded questions
    const availableQuestions = questions.filter(q => !excludeIds.includes(q.id));
    
    if (availableQuestions.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex];
  }

  /**
   * Get questions by intimacy level range
   */
  static getQuestionsByIntimacyLevel(
    stage: 'stranger' | 'acquaintance' | 'friend' | 'close_friend',
    minLevel: number,
    maxLevel: number,
    excludeIds: string[] = []
  ): Question[] {
    const allQuestions = this.getQuestionsForStage(stage);
    return allQuestions.filter(q => 
      q.intimacyLevel >= minLevel && 
      q.intimacyLevel <= maxLevel &&
      !excludeIds.includes(q.id)
    );
  }

  /**
   * Get total question count
   */
  static getTotalQuestionCount(): number {
    return Object.values(QUESTION_BANK)
      .flatMap(stage => stage.categories)
      .flatMap(category => category.questions)
      .length;
  }

  /**
   * Get question by ID
   */
  static getQuestionById(id: string): Question | null {
    for (const stage of Object.values(QUESTION_BANK)) {
      for (const category of stage.categories) {
        const question = category.questions.find(q => q.id === id);
        if (question) return question;
      }
    }
    return null;
  }

  /**
   * Validate question bank integrity
   */
  static validateQuestionBank(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const allIds = new Set<string>();

    for (const [stageName, stage] of Object.entries(QUESTION_BANK)) {
      for (const category of stage.categories) {
        for (const question of category.questions) {
          // Check for duplicate IDs
          if (allIds.has(question.id)) {
            errors.push(`Duplicate question ID: ${question.id}`);
          }
          allIds.add(question.id);

          // Check stage consistency
          if (question.stage !== stage.stage) {
            errors.push(`Question ${question.id} has mismatched stage: ${question.stage} vs ${stage.stage}`);
          }

          // Check intimacy level range
          const [minLevel, maxLevel] = stage.intimacyRange;
          if (question.intimacyLevel < minLevel || question.intimacyLevel > maxLevel) {
            errors.push(`Question ${question.id} intimacy level ${question.intimacyLevel} outside range [${minLevel}, ${maxLevel}]`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}