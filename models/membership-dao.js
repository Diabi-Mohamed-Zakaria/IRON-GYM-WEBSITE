'use strict';

const sqlite = require('sqlite3');
const path = require('path');

class MembershipDAO {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'db', 'gym.db');
    this.db = new sqlite.Database(this.dbPath, (err) => {
      if (err) throw err;
    });

    // Ensure tables exist (runs once)
    this.ensureTables();
  }

  ensureTables() {
    const ensureMembershipTableSql = `
      CREATE TABLE IF NOT EXISTS memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        plan_type TEXT NOT NULL CHECK(plan_type IN ('basic', 'premium', 'elite')),
        billing_period TEXT NOT NULL CHECK(billing_period IN ('monthly', 'annual')),
        price DECIMAL(10,2) NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active', 'expired', 'cancelled')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    const ensurePaymentsTableSql = `
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        membership_id INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'bank_transfer')),
        payment_status TEXT NOT NULL CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')),
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        due_date DATE NOT NULL,
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE
      )
    `;

    this.db.run(ensureMembershipTableSql);
    this.db.run(ensurePaymentsTableSql);
  }

  // Membership plans configuration
  static get MEMBERSHIP_PLANS() {
    return {
      basic: {
        monthly: 29.99,
        annual: 299.99,
        features: ['Gym Access', 'Basic Equipment', 'Locker Room']
      },
      premium: {
        monthly: 49.99,
        annual: 499.99,
        features: ['Gym Access', 'All Equipment', 'Group Classes', 'Locker Room', 'Shower']
      },
      elite: {
        monthly: 79.99,
        annual: 799.99,
        features: ['Gym Access', 'All Equipment', 'Unlimited Classes', 'Personal Trainer Sessions', 'Spa Access', 'Nutrition Consultation']
      }
    };
  }

  getMembershipByUser(userId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM memberships WHERE user_id = ?';
      this.db.get(sql, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  getMembershipPlans() {
    return MembershipDAO.MEMBERSHIP_PLANS;
  }

  createMembership(userId, planType, billingPeriod, paymentMethod) {
    return new Promise((resolve, reject) => {
      const price = MembershipDAO.MEMBERSHIP_PLANS[planType][billingPeriod];
      const startDate = new Date().toISOString().split('T')[0];
      
      // Calculate end date
      const endDate = new Date();
      if (billingPeriod === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const sql = 'INSERT INTO memberships(user_id, plan_type, billing_period, price, status, start_date, end_date) VALUES(?, ?, ?, ?, ?, ?, ?)';
      this.db.run(sql, [userId, planType, billingPeriod, price, 'active', startDate, endDateStr], function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  }

  createPayment(userId, membershipId, amount, paymentMethod, dueDate, notes = '') {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO payments(user_id, membership_id, amount, payment_method, payment_status, due_date, notes) VALUES(?, ?, ?, ?, ?, ?, ?)';
      this.db.run(sql, [userId, membershipId, amount, paymentMethod, 'pending', dueDate, notes], function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  }

  async upsertMembership(userId, planType, billingPeriod, paymentMethod) {
    const existing = await this.getMembershipByUser(userId);
    
    if (!existing) {
      const membershipId = await this.createMembership(userId, planType, billingPeriod, paymentMethod);
      const price = MembershipDAO.MEMBERSHIP_PLANS[planType][billingPeriod];
      const dueDate = new Date().toISOString().split('T')[0];
      
      // Create payment record
      await this.createPayment(userId, membershipId, price, paymentMethod, dueDate);
      
      return await this.getMembershipByUser(userId);
    }
    
    // Update existing membership
    const price = MembershipDAO.MEMBERSHIP_PLANS[planType][billingPeriod];
    const startDate = new Date().toISOString().split('T')[0];
    
    const endDate = new Date();
    if (billingPeriod === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return await new Promise((resolve, reject) => {
      const sql = 'UPDATE memberships SET plan_type = ?, billing_period = ?, price = ?, status = ?, start_date = ?, end_date = ? WHERE user_id = ?';
      this.db.run(sql, [planType, billingPeriod, price, 'active', startDate, endDateStr, userId], function (err) {
        if (err) return reject(err);
        
        // Create new payment record
        const dueDate = new Date().toISOString().split('T')[0];
        this.createPayment(userId, existing.id, price, paymentMethod, dueDate)
          .then(() => this.getMembershipByUser(userId))
          .then(resolve)
          .catch(reject);
      }.bind(this));
    });
  }

  getPaymentsByUser(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, m.plan_type, m.billing_period 
        FROM payments p 
        JOIN memberships m ON p.membership_id = m.id 
        WHERE p.user_id = ? 
        ORDER BY p.payment_date DESC
      `;
      this.db.all(sql, [userId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  updatePaymentStatus(paymentId, status, notes = '') {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE payments SET payment_status = ?, notes = ? WHERE id = ?';
      this.db.run(sql, [status, notes, paymentId], function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  }

  getMonthlyRevenue(year, month) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          SUM(amount) as total_revenue,
          COUNT(*) as total_payments,
          payment_method,
          COUNT(*) as count_by_method
        FROM payments 
        WHERE payment_status = 'completed' 
          AND strftime('%Y', payment_date) = ? 
          AND strftime('%m', payment_date) = ?
        GROUP BY payment_method
      `;
      this.db.all(sql, [year.toString(), month.toString().padStart(2, '0')], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  /**
   * Chiude la connessione al database
   */
  close() {
    this.db.close();
  }
}

module.exports = MembershipDAO;