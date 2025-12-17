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
    stat: "Comment-to-DM automation converts 3x better than cold outreach.",
    message: "When someone comments, they're already interested. Capture them instantly.",
  },
  phase3: {
    stat: "Coaches with a lead magnet generate 3x more discovery calls than those relying on social media alone.",
    message: "You're about to build a client-attraction system that works while you're coaching, sleeping, or living your life.",
  },
} as const;

// Phase 1 Setup Items - Card-visible stats
export const SETUP_ITEM_MOTIVATION = {
  profile_complete: {
    cardStat: "Clients decide if they trust you before you say a word.",
    before: "Clients form lasting opinions from your first contact. A complete profile signals you're ready for business.",
    after: "Done! You now look as professional as you are.",
  },
  calendar_connected: {
    cardStat: "23% of interested prospects drop off during back-and-forth scheduling.",
    before: "The back-and-forth of scheduling emails loses 23% of interested prospects before they ever book.",
    after: "No more 'when are you free?' emails. Clients book themselves.",
  },
  booking_page_created: {
    cardStat: "A booking link lets clients say yes at 2am — without waiting for you.",
    before: "Every friction point between 'I'm interested' and 'I'm booked' costs you clients. A booking page removes all of them.",
    after: "You now have a 24/7 booking system. Clients can book you at 2am while you sleep.",
  },
  contract_prepared: {
    cardStat: "Clear agreements prevent 90% of client disputes.",
    before: "Clear agreements prevent 90% of client disputes. Protect yourself and set expectations upfront.",
    after: "Professional, protected, and ready to sign clients with confidence.",
  },
  payments_connected: {
    cardStat: "The #1 reason coaches don't get paid on time? No system.",
    before: "The #1 reason coaches don't get paid on time? No system. Fix it in 5 minutes.",
    after: "You can now get paid the moment someone says yes. No awkward invoicing.",
  },
} as const;

export const PHASE1_CELEBRATION = {
  headline: "You're officially ready for business.",
  supportingStat: "You just eliminated the top 5 reasons new clients hesitate to commit: unclear scheduling, no contract, no easy payment option, unprofessional first impression, and booking friction.",
  quote: "Professionalism isn't about being corporate. It's about making it easy for people to trust you.",
} as const;

// Phase 2 Social Capture Items - Card-visible stats
export const SOCIAL_CAPTURE_MOTIVATION = {
  social_accounts_connected: {
    cardStat: "Connected accounts enable instant automation.",
    before: "Once connected, your Instagram and Facebook can work together automatically.",
    after: "Social accounts connected and ready for automation.",
  },
  social_capture_active: {
    cardStat: "Automated DMs respond instantly — even while you sleep.",
    before: "Every comment becomes a potential booked call, captured automatically.",
    after: "Your social capture is live! Comments now trigger automatic DMs.",
  },
} as const;

export const PHASE2_CELEBRATION = {
  headline: "Your Social Capture is Live!",
  stats: [
    "Automatic DM to anyone who comments your keyword",
    "Direct link to your booking page",
    "Works on both Instagram and Facebook",
  ],
  quote: "Every comment on your posts is now a potential booked call.",
  transformation: "You've gone from 'I hope people see my posts' to 'every engaged follower gets captured automatically.'",
} as const;

// Phase 3 Funnel Builder Items
export const FUNNEL_MOTIVATION = {
  funnel_craft_complete: {
    cardStat: "A clear funnel blueprint cuts implementation time by 50%.",
    before: "Answer questions about your business to generate your complete funnel content.",
    after: "Your funnel blueprint is ready — lead magnet, landing page, emails, and social capture.",
  },
  funnel_build_complete: {
    cardStat: "Lead magnets convert 2-5% of visitors into email subscribers.",
    before: "Follow step-by-step video tutorials to build each piece of your funnel.",
    after: "Your lead generation funnel is live and working!",
  },
} as const;

export const FUNNEL_BUILDER_MOTIVATION = {
  afterIdealClient: "The clearer you are on who you help, the more your copy will resonate. You're doing the work most coaches skip.",
  afterTransformation: "This is the heart of your message. When someone reads this, they'll think 'that's exactly what I need.'",
  afterComplete: "You just created what takes most coaches weeks to write — in under 30 minutes.",
} as const;

export const PHASE3_CELEBRATION = {
  headline: "Your Funnel is Complete!",
  items: [
    "Lead magnet that builds your list while you sleep",
    "Landing page that captures your ideal clients",
    "Email sequence that nurtures leads to booked calls",
    "Social capture workflow driving traffic to your funnel",
  ],
  quote: "Every piece is connected — from social posts to DMs to landing pages to emails. Your lead generation machine is ready.",
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
