import type { DriveStep } from "driver.js";

// First-visit tutorial steps per dashboard surface. Anchors are `data-tour="…"`
// attributes on stable elements (sidebar nav, PageShell header/action, page sections,
// flow builder). Descriptions may use <b> for emphasis (driver.js renders them as HTML).
export const TOURS: Record<string, DriveStep[]> = {
  home: [
    { popover: { title: "Welcome to DMGennie 👋", description: "Here's a quick tour of your <b>dashboard</b>. It takes about 20 seconds — you can <b>skip</b> anytime." } },
    { element: "[data-tour='sidebar-nav']", popover: { title: "Your menu", description: "Move between <b>Home</b>, <b>Automations</b>, <b>Contacts</b>, <b>Inbox</b> and <b>Analytics</b> from this sidebar. It's always here.", side: "right", align: "start" } },
    { element: "[data-tour='nav-automations']", popover: { title: "Automations", description: "The heart of DMGennie. Build <b>keyword auto-DMs</b> or <b>visual flows</b> that reply to comments, story replies and DMs <b>automatically</b> — 24/7.", side: "right", align: "start" } },
    { element: "[data-tour='nav-contacts']", popover: { title: "Contacts", description: "Everyone your automations reach is saved here as a <b>lead</b> — organised with <b>tags</b> and ready to <b>export to CSV</b>.", side: "right", align: "start" } },
    { element: "[data-tour='nav-analytics']", popover: { title: "Analytics", description: "See how you're doing — <b>DMs sent</b>, <b>delivery rate</b>, <b>active automations</b> and <b>audience insights</b> — all in one place.", side: "right", align: "start" } },
  ],
  automations: [
    { element: "[data-tour='page-header']", popover: { title: "Automations", description: "Create, manage and track every Instagram <b>automation</b> here — both keyword replies and visual flows.", side: "bottom", align: "start" } },
    { element: "[data-tour='page-action']", popover: { title: "New automation", description: "Start a <b>keyword automation</b> or a <b>visual flow</b> from this button.", side: "left" } },
  ],
  contacts: [
    { element: "[data-tour='page-header']", popover: { title: "Contacts", description: "This is your <b>Instagram CRM</b>. Every lead captured by your automations lands here <b>automatically</b> — no manual entry.", side: "bottom", align: "start" } },
    { element: "[data-tour='contacts-stats']", popover: { title: "Audience at a glance", description: "A quick pulse of your audience — <b>total contacts</b>, how many shared an <b>email</b>, who's <b>active today</b>, and how many came <b>from automations</b>.", side: "bottom" } },
    { element: "[data-tour='contacts-filters']", popover: { title: "Find anyone fast", description: "<b>Search</b> by name, handle or email, and <b>filter</b> by source, relationship, date or email. Use the chips to jump to a <b>segment</b> like “With email”.", side: "bottom" } },
    { element: "[data-tour='contacts-table']", popover: { title: "Your leads", description: "Each row shows the contact's <b>handle</b>, <b>source</b>, engagement <b>tags</b> and last interaction. Select rows to <b>bulk-export</b>, or export everything from the top.", side: "top" } },
  ],
  inbox: [
    { element: "[data-tour='page-header']", popover: { title: "Inbox", description: "Your Instagram <b>conversations</b> and automation activity will appear here.", side: "bottom", align: "start" } },
  ],
  analytics: [
    { element: "[data-tour='page-header']", popover: { title: "Analytics", description: "See how your automations <b>perform</b> over time, and where your leads come from.", side: "bottom", align: "start" } },
    { element: "[data-tour='analytics-metrics']", popover: { title: "Headline numbers", description: "Your key metrics — <b>DMs sent</b>, <b>delivery rate</b>, <b>active automations</b> and <b>leads collected</b> — for the selected period.", side: "bottom" } },
    { element: "[data-tour='analytics-tabs']", popover: { title: "Dig deeper", description: "Switch between <b>Performance</b>, <b>Activity Log</b>, <b>Account Performance</b> and <b>Audience Insights</b>, and <b>export</b> any view to CSV.", side: "bottom" } },
  ],
  referral: [
    { element: "[data-tour='page-header']", popover: { title: "Refer & Earn", description: "Share your link and earn <b>commissions</b> when friends upgrade to <b>Pro</b>.", side: "bottom", align: "start" } },
  ],
  flows: [
    { element: "[data-tour='fb-palette']", popover: { title: "Blocks", description: "Drag these onto the canvas — <b>messages</b>, <b>buttons</b>, <b>conditions</b>, <b>delays</b> and more.", side: "right", align: "start" } },
    { element: "[data-tour='fb-canvas']", popover: { title: "Canvas", description: "Drop blocks here and <b>connect</b> them. <b>Right-click</b> a block for cut, copy, link and delete.", side: "left" } },
    { element: "[data-tour='fb-autoconnect']", popover: { title: "Auto-connect", description: "Let DMGennie <b>wire your blocks</b> together top-to-bottom in one click.", side: "bottom" } },
    { element: "[data-tour='fb-save']", popover: { title: "Save & go live", description: "<b>Save</b> your flow, then flip it <b>Live</b> when you're ready.", side: "bottom" } },
  ],
};

export const tourStorageKey = (pageKey: string) => `dmgennie_tour_${pageKey}`;
