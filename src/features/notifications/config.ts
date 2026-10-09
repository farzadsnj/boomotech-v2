export type NotificationWorkerConfiguration = {
  resendApiKey: string;
  adminEmail: string;
  fromEmail: string;
  siteUrl: string;
  customerReplyTo?: string;
};

export class NotificationWorkerConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationWorkerConfigurationError";
  }
}

type NotificationEnvironment = Record<string, string | undefined>;

function requiredValue(name: string, environment: NotificationEnvironment) {
  const value = environment[name]?.trim();
  if (!value) throw new NotificationWorkerConfigurationError(`Notification worker configuration is missing ${name}.`);
  return value;
}

function validSiteUrl(environment: NotificationEnvironment) {
  const value = requiredValue("SITE_URL", environment);
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
      throw new Error("unsupported protocol");
    }
    return url.origin;
  } catch {
    throw new NotificationWorkerConfigurationError("Notification worker configuration has an invalid SITE_URL.");
  }
}

export function validateNotificationWorkerEnvironment(environment: NotificationEnvironment = process.env): NotificationWorkerConfiguration {
  return {
    resendApiKey: requiredValue("RESEND_API_KEY", environment),
    adminEmail: requiredValue("BOOKING_NOTIFICATION_EMAIL", environment),
    fromEmail: requiredValue("BOOKING_FROM_EMAIL", environment),
    siteUrl: validSiteUrl(environment),
    customerReplyTo: environment.CUSTOMER_REPLY_TO_EMAIL?.trim() || undefined,
  };
}

export function validateNotificationWorkerDatabaseEnvironment(environment: NotificationEnvironment = process.env) {
  const value = requiredValue("DATABASE_URL", environment);
  try {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) throw new Error("invalid database URL");
  } catch {
    throw new NotificationWorkerConfigurationError("Notification worker configuration has an invalid DATABASE_URL.");
  }
  return value;
}
