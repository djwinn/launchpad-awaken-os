// Community channel URLs
export const COMMUNITY_CHANNELS = {
  wins: 'https://portal.awaken.digital/communities/groups/playground/channels/Wins-9mHG3r',
  testLane: 'https://portal.awaken.digital/communities/groups/playground/channels/Test-Lane-6sT7V',
  qa: 'https://portal.awaken.digital/communities/groups/playground/channels/QnA-5jUdXg'
} as const;

// Pre-written messages for sharing
export const COMMUNITY_MESSAGES = {
  phase1Complete: `🎉 PHASE 1 COMPLETE: I'm officially ready for business!

Just finished setting up:
✅ Profile
✅ Calendar
✅ Booking page
✅ Contract
✅ Payments

Someone could now book a call, sign a contract, and pay me — all handled professionally.

#ReadyForBusiness`,

  phase2Complete: `🎉 PHASE 2 COMPLETE: My lead capture is LIVE!

Now running on autopilot:
✅ Landing page
✅ Email automation
✅ Domain connected
✅ Social automation

Comment → DM → Landing page → Email list. All while I sleep.

#LeadCaptureLive`,

  phase3Complete: `🎉 PHASE 3 COMPLETE: Full funnel is LIVE!

I now have:
✅ Lead magnet
✅ Landing page
✅ Email sequence
✅ Complete path to clients

Done beats perfect. I'm live. 🚀

#FullFunnelLive`,

  landingPageLive: `🧪 My landing page is LIVE!

Not perfect, but it's out there. Now I can see what actually works.

Feedback welcome!

#TestLane #ShippedIt`,

  contentGenerated: `🧪 Just generated my social capture content with the AI!

Got my DM templates, post CTAs, and landing page copy drafted. Now to implement.

Sharing for accountability!

#TestLane`,

  funnelContentGenerated: `🧪 Just generated my full funnel content!

Lead magnet outline, landing page, thank you page, booking page copy, and 10-email nurture sequence — all drafted.

Now to build it out. Here we go!

#TestLane`
} as const;

export type CommunityChannel = keyof typeof COMMUNITY_CHANNELS;
export type CommunityMessageKey = keyof typeof COMMUNITY_MESSAGES;

// Get channel name for display
export function getChannelDisplayName(channel: CommunityChannel): string {
  const names: Record<CommunityChannel, string> = {
    wins: 'Wins',
    testLane: 'Test Lane',
    qa: 'Q&A'
  };
  return names[channel];
}
