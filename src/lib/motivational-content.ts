// Motivational stats, quotes, and messages for user encouragement
// All stats are from peer-reviewed or industry research

export const DASHBOARD_QUOTES = {
  progress10to30: "Every expert was once a beginner. You're building something real.",
  progress40to60: "You're halfway to having a business that runs without you micromanaging every detail.",
  progress70to90: "Almost there. Most people never get this far.",
  progress100: "You did it. You now have systems most coaches spend years piecing together.",
} as const;

export const PHASE_INTRO_STATS = {
  phase1: {
    stat: "First impressions form in under 7 seconds.",
    message: "A professional setup builds trust before you say a word.",
  },
  phase2: {
    stat: "78% of clients choose the first business that responds.",
    message: "Most coaches take 24+ hours to reply. Your AI responds in seconds.",
  },
  phase3: {
    stat: "Coaches with a lead magnet generate 3x more discovery calls than those relying on social media alone.",
    message: "You're about to build a client-attraction system that works while you're coaching, sleeping, or living your life.",
  },
} as const;

// Phase 1 Setup Items
export const SETUP_ITEM_MOTIVATION = {
  profile_complete: {
    before: "Clients form lasting opinions from your first contact. A complete profile signals you're ready for business.",
    after: "Done! You now look as professional as you are.",
  },
  calendar_connected: {
    before: "The back-and-forth of scheduling emails loses 23% of interested prospects before they ever book.",
    after: "No more 'when are you free?' emails. Clients book themselves.",
  },
  booking_page_created: {
    before: "Every friction point between 'I'm interested' and 'I'm booked' costs you clients. A booking page removes all of them.",
    after: "You now have a 24/7 booking system. Clients can book you at 2am while you sleep.",
  },
  contract_prepared: {
    before: "Clear agreements prevent 90% of client disputes. Protect yourself and set expectations upfront.",
    after: "Professional, protected, and ready to sign clients with confidence.",
  },
  payments_connected: {
    before: "The #1 reason coaches don't get paid on time? No system. Fix it in 5 minutes.",
    after: "You can now get paid the moment someone says yes. No awkward invoicing.",
  },
} as const;

export const PHASE1_CELEBRATION = {
  headline: "You're officially ready for business.",
  supportingStat: "You just eliminated the top 5 reasons new clients hesitate to commit: unclear scheduling, no contract, no easy payment option, unprofessional first impression, and booking friction.",
  quote: "Professionalism isn't about being corporate. It's about making it easy for people to trust you.",
} as const;

// Phase 2 AI Training Items
export const AI_TRAINING_MOTIVATION = {
  ai_foundation_complete: {
    before: "The average business takes 42 hours to respond to an inquiry. By then, your potential client has moved on.",
    midConversation: "You're doing great. The more detail you share, the more your AI will sound like you — not a robot.",
    after: "Your AI now knows your business as well as you do.",
  },
  ai_responder_active: {
    stat: "Responding within 5 minutes makes you 21x more likely to convert a lead.",
    before: "Your AI responds instantly. That's your new competitive advantage.",
    context: "While other coaches are sleeping, on calls, or at dinner — your AI is answering questions and booking calls.",
    after: "Your AI assistant is live. You're now responding 24/7.",
    celebration: "You just solved the #1 conversion killer for coaches: slow response time.",
  },
  reminders_configured: {
    stat: "SMS reminders reduce no-shows by 38%.",
    before: "That's roughly 1 in 3 missed calls you'll now save.",
    context: "No-shows cost you time, energy, and momentum. A simple reminder protects all three.",
    research: "Studies show reminder systems reduce no-show rates from 23% to as low as 8% — a 65% improvement.",
    after: "Your bookings are now protected. Fewer no-shows, more clients.",
  },
} as const;

export const PHASE2_CELEBRATION = {
  headline: "Your Conversion Protection is Complete",
  stats: [
    "Instant response (21x better conversion than waiting 30 min)",
    "24/7 availability (while 90% of coaches are offline)",
    "No-show protection (38% fewer missed calls)",
  ],
  quote: "You're no longer competing on how fast you can reply. The system handles it.",
  transformation: "You've gone from 'I hope I don't miss anything' to 'the system has my back.'",
} as const;

// Phase 3 Funnel Builder
export const FUNNEL_BUILDER_MOTIVATION = {
  afterIdealClient: "The clearer you are on who you help, the more your copy will resonate. You're doing the work most coaches skip.",
  afterTransformation: "This is the heart of your message. When someone reads this, they'll think 'that's exactly what I need.'",
  afterComplete: "You just created what takes most coaches weeks to write — in under 30 minutes.",
} as const;

export const PHASE3_CELEBRATION = {
  headline: "Your Client Magnet is Ready",
  items: [
    "A lead magnet that builds your list while you sleep",
    "A landing page that speaks directly to your ideal client",
    "Emails that nurture cold leads into booked calls",
    "Copy you can use across all your marketing",
  ],
  quote: "Most coaches spend months trying to figure out their messaging. You just did it in one conversation.",
} as const;

// Micro-encouragements (rotate through these on item completion)
export const COMPLETION_MESSAGES = [
  "Done! One less thing on your plate.",
  "Checked off. You're making real progress.",
  "That's another piece in place.",
  "Nicely done. Keep going.",
] as const;

export function getRandomCompletionMessage(): string {
  return COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
}

export function getDashboardQuote(percentage: number): string {
  if (percentage >= 100) return DASHBOARD_QUOTES.progress100;
  if (percentage >= 70) return DASHBOARD_QUOTES.progress70to90;
  if (percentage >= 40) return DASHBOARD_QUOTES.progress40to60;
  return DASHBOARD_QUOTES.progress10to30;
}
