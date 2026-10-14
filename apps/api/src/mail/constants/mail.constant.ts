export const MAIL_QUEUE_NAME = 'email';
export const SEND_MAIL_JOB = 'send-email';

export interface ISendMailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, unknown>;
  cc?: string[];
  bcc?: string[];
  attachments?: Record<string, unknown>[];
}
