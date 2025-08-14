import { EmailOptions, sendEmail, EmailResponse } from './send';

// Email queue item interface
export interface EmailQueueItem {
  id: string;
  email: EmailOptions;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error?: string;
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Email queue configuration
export interface EmailQueueConfig {
  maxRetries?: number;
  retryDelay?: number; // in milliseconds
  batchSize?: number;
  processInterval?: number; // in milliseconds
}

// Default configuration
const DEFAULT_CONFIG: EmailQueueConfig = {
  maxRetries: 3,
  retryDelay: 60000, // 1 minute
  batchSize: 10,
  processInterval: 5000, // 5 seconds
};

// In-memory queue (for development/demo - use Redis or database in production)
class EmailQueue {
  private queue: Map<string, EmailQueueItem> = new Map();
  private config: EmailQueueConfig;
  private isProcessing: boolean = false;
  private processTimer: NodeJS.Timer | null = null;

  constructor(config: EmailQueueConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add an email to the queue
   */
  async add(
    email: EmailOptions,
    options: {
      scheduledFor?: Date;
      priority?: number;
    } = {}
  ): Promise<string> {
    const id = this.generateId();
    const item: EmailQueueItem = {
      id,
      email,
      attempts: 0,
      maxAttempts: this.config.maxRetries || 3,
      status: 'pending',
      scheduledFor: options.scheduledFor,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.set(id, item);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return id;
  }

  /**
   * Add multiple emails to the queue
   */
  async addBatch(
    emails: EmailOptions[],
    options: {
      scheduledFor?: Date;
      priority?: number;
    } = {}
  ): Promise<string[]> {
    const ids: string[] = [];
    
    for (const email of emails) {
      const id = await this.add(email, options);
      ids.push(id);
    }

    return ids;
  }

  /**
   * Get email status from queue
   */
  getStatus(id: string): EmailQueueItem | undefined {
    return this.queue.get(id);
  }

  /**
   * Cancel a queued email
   */
  cancel(id: string): boolean {
    const item = this.queue.get(id);
    if (item && item.status === 'pending') {
      this.queue.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Start processing the queue
   */
  private startProcessing(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processTimer = setInterval(
      () => this.processQueue(),
      this.config.processInterval || 5000
    );

    // Process immediately
    this.processQueue();
  }

  /**
   * Stop processing the queue
   */
  stopProcessing(): void {
    this.isProcessing = false;
    if (this.processTimer) {
      clearInterval(this.processTimer);
      this.processTimer = null;
    }
  }

  /**
   * Process pending emails in the queue
   */
  private async processQueue(): Promise<void> {
    const now = new Date();
    const pendingItems = Array.from(this.queue.values())
      .filter(item => 
        item.status === 'pending' &&
        (!item.scheduledFor || item.scheduledFor <= now)
      )
      .slice(0, this.config.batchSize);

    if (pendingItems.length === 0) {
      return;
    }

    // Process emails in parallel
    const promises = pendingItems.map(item => this.processEmail(item));
    await Promise.allSettled(promises);

    // Check if queue is empty and stop processing
    const hasMoreItems = Array.from(this.queue.values()).some(
      item => item.status === 'pending'
    );
    
    if (!hasMoreItems) {
      this.stopProcessing();
    }
  }

  /**
   * Process a single email
   */
  private async processEmail(item: EmailQueueItem): Promise<void> {
    try {
      // Update status to processing
      item.status = 'processing';
      item.updatedAt = new Date();
      this.queue.set(item.id, item);

      // Send the email
      const response = await sendEmail(item.email);

      if (response.success) {
        // Email sent successfully
        item.status = 'sent';
        item.sentAt = new Date();
        item.updatedAt = new Date();
        this.queue.set(item.id, item);
        
        // Remove from queue after a delay (for status checking)
        setTimeout(() => this.queue.delete(item.id), 300000); // 5 minutes
      } else {
        // Email failed
        item.attempts++;
        item.error = response.error;
        item.updatedAt = new Date();

        if (item.attempts >= item.maxAttempts) {
          // Max attempts reached, mark as failed
          item.status = 'failed';
          this.queue.set(item.id, item);
          
          // Keep failed items for 24 hours
          setTimeout(() => this.queue.delete(item.id), 86400000);
        } else {
          // Schedule retry
          item.status = 'pending';
          item.scheduledFor = new Date(
            Date.now() + (this.config.retryDelay || 60000) * item.attempts
          );
          this.queue.set(item.id, item);
        }
      }
    } catch (error) {
      // Unexpected error
      item.attempts++;
      item.error = error instanceof Error ? error.message : 'Unknown error';
      item.status = item.attempts >= item.maxAttempts ? 'failed' : 'pending';
      item.updatedAt = new Date();
      
      if (item.status === 'pending') {
        item.scheduledFor = new Date(
          Date.now() + (this.config.retryDelay || 60000) * item.attempts
        );
      }
      
      this.queue.set(item.id, item);
    }
  }

  /**
   * Generate unique ID for queue items
   */
  private generateId(): string {
    return `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  } {
    const items = Array.from(this.queue.values());
    return {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      processing: items.filter(i => i.status === 'processing').length,
      sent: items.filter(i => i.status === 'sent').length,
      failed: items.filter(i => i.status === 'failed').length,
    };
  }

  /**
   * Clear completed emails from queue
   */
  clearCompleted(): number {
    const toDelete: string[] = [];
    
    this.queue.forEach((item, id) => {
      if (item.status === 'sent' || item.status === 'failed') {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => this.queue.delete(id));
    return toDelete.length;
  }

  /**
   * Get all items in queue
   */
  getAllItems(): EmailQueueItem[] {
    return Array.from(this.queue.values());
  }

  /**
   * Retry failed emails
   */
  retryFailed(): number {
    let count = 0;
    
    this.queue.forEach(item => {
      if (item.status === 'failed') {
        item.status = 'pending';
        item.attempts = 0;
        item.error = undefined;
        item.updatedAt = new Date();
        count++;
      }
    });

    if (count > 0 && !this.isProcessing) {
      this.startProcessing();
    }

    return count;
  }
}

// Create and export a singleton instance
export const emailQueue = new EmailQueue();

// Helper functions for common email queue operations

/**
 * Queue a welcome email
 */
export async function queueWelcomeEmail(
  email: string,
  firstName: string,
  verificationUrl?: string
): Promise<string> {
  const WelcomeEmail = (await import('@/emails/welcome')).default;
  
  return emailQueue.add({
    to: email,
    subject: 'Welcome to Omni E-Ride! 🎉',
    react: WelcomeEmail({
      firstName,
      email,
      verificationUrl,
    }),
    tags: [
      { name: 'type', value: 'welcome' },
      { name: 'user_email', value: email },
    ],
  });
}

/**
 * Queue an order confirmation email
 */
export async function queueOrderConfirmationEmail(
  email: string,
  orderData: any
): Promise<string> {
  const OrderConfirmationEmail = (await import('@/emails/order-confirmation')).default;
  
  return emailQueue.add({
    to: email,
    subject: `Order Confirmed - #${orderData.orderNumber}`,
    react: OrderConfirmationEmail(orderData),
    tags: [
      { name: 'type', value: 'order_confirmation' },
      { name: 'order_id', value: orderData.orderNumber },
    ],
  });
}

/**
 * Queue batch emails with scheduling
 */
export async function queueBatchEmails(
  emails: EmailOptions[],
  scheduledFor?: Date
): Promise<string[]> {
  return emailQueue.addBatch(emails, { scheduledFor });
}

// Export types
export type { EmailQueueConfig };

// Default export
export default emailQueue;
