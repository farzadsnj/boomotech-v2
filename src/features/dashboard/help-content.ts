export type DashboardHelpItem = {
  question: string;
  answer: string;
  links?: { href: string; label: string }[];
};

export const dashboardHelpItems: DashboardHelpItem[] = [
  {
    question: "What do the request statuses mean?",
    answer: "New means the request is recorded and has not been started. In progress means it is being reviewed or worked on. Waiting for you means BoomoTech needs your reply. Resolved means the recorded work or guidance is complete. Withdrawn means you closed the request before work continued.",
  },
  {
    question: "How do I reply to a request?",
    answer: "Open My requests, expand the relevant conversation and use the reply field when it is available. Replies are saved to that request. Never include passwords, MFA codes, recovery keys or payment-card information.",
    links: [{ href: "/dashboard#customer-requests", label: "Open My requests" }],
  },
  {
    question: "Why can I not edit or withdraw a request?",
    answer: "The original description can be edited or withdrawn only while the request is new and unread. Once processing starts, the original record is locked to protect the history. You can add information through the request conversation when replies are available.",
  },
  {
    question: "Does sending a request confirm an appointment?",
    answer: "No. A request provides information for review. It does not confirm an appointment, availability, price, response time or service scope.",
  },
  {
    question: "How do I ask for help with a new issue?",
    answer: "Use the secure request form for a new technology issue or consultation request. Include a useful summary without account secrets or confidential third-party information.",
    links: [{ href: "/booking", label: "Create a new request" }, { href: "/support", label: "Read support guidance" }],
  },
  {
    question: "How do I manage my account or password?",
    answer: "Account settings lets you update your supported profile details, change your password or sign out active sessions. Password recovery remains available if you cannot confirm your current password.",
    links: [{ href: "/dashboard/settings", label: "Open account settings" }],
  },
];
