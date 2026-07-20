import type { DriveStep } from "driver.js";

// First-visit tutorial steps per dashboard surface. Anchors are `data-tour="…"`
// attributes on stable elements (sidebar nav, PageShell header/action, flow builder).
export const TOURS: Record<string, DriveStep[]> = {
  home: [
    { popover: { title: "Welcome to DMGennie 👋", description: "Here's a 20-second tour of your dashboard. You can skip anytime." } },
    { element: "[data-tour='sidebar-nav']", popover: { title: "Your menu", description: "Move between Home, Automations, Contacts, Inbox and more from here.", side: "right", align: "start" } },
    { element: "[data-tour='nav-automations']", popover: { title: "Automations", description: "This is where you build keyword auto-DMs and visual flows.", side: "right", align: "start" } },
  ],
  automations: [
    { element: "[data-tour='page-header']", popover: { title: "Automations", description: "Create, manage and track all your Instagram automations here.", side: "bottom", align: "start" } },
    { element: "[data-tour='page-action']", popover: { title: "New automation", description: "Start a keyword automation or a visual flow from this button.", side: "left" } },
  ],
  contacts: [
    { element: "[data-tour='page-header']", popover: { title: "Contacts", description: "Every lead captured by your automations lands here — with tags, filters and CSV export.", side: "bottom", align: "start" } },
  ],
  inbox: [
    { element: "[data-tour='page-header']", popover: { title: "Inbox", description: "Your Instagram conversations and automation activity will appear here.", side: "bottom", align: "start" } },
  ],
  analytics: [
    { element: "[data-tour='page-header']", popover: { title: "Analytics", description: "Track delivery, performance and audience insights across your automations.", side: "bottom", align: "start" } },
  ],
  referral: [
    { element: "[data-tour='page-header']", popover: { title: "Refer & Earn", description: "Share your link and earn commissions when friends upgrade to Pro.", side: "bottom", align: "start" } },
  ],
  settings: [
    { element: "[data-tour='page-header']", popover: { title: "Settings", description: "Manage your profile, Instagram connection and preferences here.", side: "bottom", align: "start" } },
  ],
  help: [
    { element: "[data-tour='page-header']", popover: { title: "Help", description: "Find guides and support. You can replay any tutorial from this page.", side: "bottom", align: "start" } },
  ],
  flows: [
    { element: "[data-tour='fb-palette']", popover: { title: "Blocks", description: "Drag these onto the canvas — messages, buttons, conditions, delays and more.", side: "right", align: "start" } },
    { element: "[data-tour='fb-canvas']", popover: { title: "Canvas", description: "Drop blocks here and connect them. Right-click a block for cut, copy, link and delete.", side: "left" } },
    { element: "[data-tour='fb-autoconnect']", popover: { title: "Auto-connect", description: "Let DMGennie wire your blocks together top-to-bottom in one click.", side: "bottom" } },
    { element: "[data-tour='fb-save']", popover: { title: "Save & go live", description: "Save your flow, then flip it Live when you're ready.", side: "bottom" } },
  ],
};

export const tourStorageKey = (pageKey: string) => `dmgennie_tour_${pageKey}`;
