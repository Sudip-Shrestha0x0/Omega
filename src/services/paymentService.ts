export interface Plan {
  id: 'free' | 'pro' | 'unlimited';
  name: string;
  price: number;
  features: string[];
  limits: {
    messagesPerDay: number;
    searchesPerDay: number;
    codeGenerations: number;
    teamMembers: number;
  };
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  plan: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
}

class PaymentService {
  private transactions: Transaction[] = [];
  
  plans: Record<string, Plan> = {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      features: [
        '10 messages per day',
        '5 internet searches per day',
        'Basic code generation',
        'Community support',
      ],
      limits: {
        messagesPerDay: 10,
        searchesPerDay: 5,
        codeGenerations: 3,
        teamMembers: 1,
      },
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 29.99,
      features: [
        '500 messages per day',
        '100 internet searches per day',
        'Advanced code generation',
        'Priority support',
        'Team collaboration (5 members)',
        'Custom AI training',
      ],
      limits: {
        messagesPerDay: 500,
        searchesPerDay: 100,
        codeGenerations: 100,
        teamMembers: 5,
      },
    },
    unlimited: {
      id: 'unlimited',
      name: 'Unlimited',
      price: 99.99,
      features: [
        'Unlimited messages',
        'Unlimited internet searches',
        'Advanced code generation',
        'Priority support 24/7',
        'Unlimited team members',
        'Custom AI training',
        'API access',
        'Dedicated account manager',
      ],
      limits: {
        messagesPerDay: Infinity,
        searchesPerDay: Infinity,
        codeGenerations: Infinity,
        teamMembers: Infinity,
      },
    },
  };

  async createCheckoutSession(userId: string, planId: string): Promise<{ sessionId: string; url: string }> {
    console.log(`💳 Creating checkout session for user ${userId}, plan: ${planId}`);
    
    const sessionId = `cs_${Date.now()}_${userId}`;
    const url = `https://checkout.stripe.com/pay/${sessionId}`;
    
    await this.delay(500);
    
    return { sessionId, url };
  }

  async processPayment(userId: string, planId: string, amount: number): Promise<Transaction> {
    console.log(`💰 Processing payment: $${amount} for user ${userId}`);
    
    await this.delay(1000);
    
    const transaction: Transaction = {
      id: `txn_${Date.now()}`,
      userId,
      amount,
      plan: planId,
      status: 'completed',
      timestamp: new Date(),
    };
    
    this.transactions.push(transaction);
    console.log(`✅ Payment processed: ${transaction.id}`);
    
    return transaction;
  }

  getTransactions(userId?: string): Transaction[] {
    if (userId) {
      return this.transactions.filter(t => t.userId === userId);
    }
    return this.transactions;
  }

  getRevenue(): {
    total: number;
    monthly: number;
    daily: number;
    transactions: number;
  } {
    const total = this.transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const monthly = this.transactions
      .filter(t => t.status === 'completed' && t.timestamp >= monthStart)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const daily = this.transactions
      .filter(t => t.status === 'completed' && t.timestamp >= dayStart)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      total,
      monthly,
      daily,
      transactions: this.transactions.length,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const paymentService = new PaymentService();
