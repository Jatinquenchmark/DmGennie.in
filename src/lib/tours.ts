import type { DriveStep } from "driver.js";

// First-visit tutorial steps per dashboard surface. Anchors are `data-tour="…"`
// attributes on stable elements (sidebar nav, PageShell header/action, page sections,
// flow builder). Descriptions may use <b> for emphasis (driver.js renders them as HTML).
export const TOURS: Record<string, DriveStep[]> = {
  home: [
    { popover: { title: "Welcome to DMGennie 👋", description: "Here is a quick tour of your <b>dashboard</b>. It takes about 30 seconds, and you can <b>skip</b> at any point." } },
    { element: "[data-tour='home-quick-actions']", popover: { title: "Quick Actions", description: "The fastest way to launch something. Each card is a <b>ready made automation</b>, like <b>Auto DM from comments</b>, <b>Grow followers</b> or <b>Generate leads</b>. Tap one and the builder opens with the trigger, keywords and message already filled in, so you only tweak the wording. Cards marked <b>Pro</b> need an upgrade first.", side: "bottom" } },
    { element: "[data-tour='home-performance']", popover: { title: "Performance snapshot", description: "Your live results at a glance: <b>DMs sent</b>, <b>link clicks</b>, <b>leads captured</b> and <b>delivery rate</b>. Use the <b>range picker</b> on the right to switch between the last 7 days, 30 days or all time. If delivery rate dips, it usually means some recipients have <b>closed DMs</b>.", side: "top" } },
    { element: "[data-tour='sidebar-nav']", popover: { title: "Your menu", description: "Move between <b>Home</b>, <b>Automations</b>, <b>Contacts</b>, <b>Inbox</b> and <b>Analytics</b> from this sidebar. It stays with you on every page.", side: "right", align: "start" } },
    { element: "[data-tour='nav-automations']", popover: { title: "Automations", description: "The heart of DMGennie. Build <b>keyword auto DMs</b> or <b>visual flows</b> that reply to comments, story replies and DMs <b>automatically</b>, around the clock.", side: "right", align: "start" } },
    { element: "[data-tour='nav-contacts']", popover: { title: "Contacts", description: "Everyone your automations reach is saved here as a <b>lead</b>, organised with <b>tags</b> and ready to <b>export to CSV</b>.", side: "right", align: "start" } },
    { element: "[data-tour='nav-analytics']", popover: { title: "Analytics", description: "Go deeper than the snapshot with <b>per automation performance</b>, an <b>activity log</b> and <b>audience insights</b>.", side: "right", align: "start" } },
  ],
  automations: [
    { element: "[data-tour='page-header']", popover: { title: "Automations", description: "Create, manage and track every Instagram <b>automation</b> here, both keyword replies and visual flows.", side: "bottom", align: "start" } },
    { element: "[data-tour='page-action']", popover: { title: "New automation", description: "Start a <b>keyword automation</b> or a <b>visual flow</b> from this button.", side: "left" } },
  ],
  contacts: [
    { element: "[data-tour='page-header']", popover: { title: "Contacts", description: "This is your <b>Instagram CRM</b>. Every lead captured by your automations lands here <b>automatically</b>, with no manual entry.", side: "bottom", align: "start" } },
    { element: "[data-tour='contacts-stats']", popover: { title: "Audience at a glance", description: "A quick pulse of your audience: <b>total contacts</b>, how many shared an <b>email</b>, who is <b>active today</b>, and how many came <b>from automations</b>.", side: "bottom" } },
    { element: "[data-tour='contacts-filters']", popover: { title: "Find anyone fast", description: "<b>Search</b> by name, handle or email, and <b>filter</b> by source, relationship, date or email. The chips below jump straight to a <b>segment</b> such as “With email”.", side: "bottom" } },
    { element: "[data-tour='contacts-table']", popover: { title: "Your leads", description: "Each row shows the contact's <b>handle</b>, <b>source</b>, engagement <b>tags</b> and last interaction. Select rows to <b>bulk export</b>, or export everything from the top.", side: "top" } },
  ],
  inbox: [
    { element: "[data-tour='page-header']", popover: { title: "Inbox", description: "Your Instagram <b>conversations</b> and automation activity will appear here.", side: "bottom", align: "start" } },
  ],
  analytics: [
    { element: "[data-tour='page-header']", popover: { title: "Analytics", description: "See how your automations <b>perform</b> over time, and where your leads come from.", side: "bottom", align: "start" } },
    { element: "[data-tour='analytics-metrics']", popover: { title: "Headline numbers", description: "Your key metrics for the selected period: <b>DMs sent</b>, <b>delivery rate</b>, <b>active automations</b> and <b>leads collected</b>.", side: "bottom" } },
    { element: "[data-tour='analytics-tabs']", popover: { title: "Dig deeper", description: "Switch between <b>Performance</b>, <b>Activity Log</b>, <b>Account Performance</b> and <b>Audience Insights</b>, then <b>export</b> any view to CSV.", side: "bottom" } },
  ],
  referral: [
    { element: "[data-tour='page-header']", popover: { title: "Refer & Earn", description: "Share your link and earn <b>commissions</b> when friends upgrade to <b>Pro</b>.", side: "bottom", align: "start" } },
  ],
  flows: [
    { element: "[data-tour='fb-palette']", popover: { title: "Blocks", description: "Drag these onto the canvas: <b>messages</b>, <b>buttons</b>, <b>conditions</b>, <b>delays</b> and more.", side: "right", align: "start" } },
    { element: "[data-tour='fb-canvas']", popover: { title: "Canvas", description: "Drop blocks here and <b>connect</b> them. <b>Right click</b> a block for cut, copy, link and delete.", side: "left" } },
    { element: "[data-tour='fb-autoconnect']", popover: { title: "Auto-connect", description: "Let DMGennie <b>wire your blocks</b> together top to bottom in one click.", side: "bottom" } },
    { element: "[data-tour='fb-save']", popover: { title: "Save & go live", description: "<b>Save</b> your flow, then flip it <b>Live</b> when you are ready.", side: "bottom" } },
  ],
};

export const tourStorageKey = (pageKey: string) => `dmgennie_tour_${pageKey}`;
