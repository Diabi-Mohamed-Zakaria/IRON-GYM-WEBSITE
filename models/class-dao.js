'use strict';

const sqlite = require('sqlite3');
const path = require('path');

class ClassDAO {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'db', 'gym.db');
    this.db = new sqlite.Database(this.dbPath, (err) => {
      if (err) throw err;
    });
  }

  /**
   * Ottiene tutte le classi
   * @returns {Promise<Array>} - Array di classi
   */
  getAllClasses() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.*, u.nome as trainer_nome, u.cognome as trainer_cognome 
        FROM classes c 
        LEFT JOIN users u ON c.trainer_id = u.id
        ORDER BY c.day_of_week, c.time
      `;
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Ottiene una classe per ID
   * @param {number} id - ID della classe
   * @returns {Promise<Object>} - Oggetto classe
   */
  getClassById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.*, u.nome as trainer_nome, u.cognome as trainer_cognome 
        FROM classes c 
        LEFT JOIN users u ON c.trainer_id = u.id
        WHERE c.id = ?
      `;
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve({ error: 'Classe non trovata.' });
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Cerca classi per nome, trainer o giorno
   * @param {string} query - Query di ricerca
   * @returns {Promise<Array>} - Array di classi filtrate
   */
  searchClasses(query) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.*, u.nome as trainer_nome, u.cognome as trainer_cognome 
        FROM classes c 
        LEFT JOIN users u ON c.trainer_id = u.id
        WHERE c.name LIKE ? 
           OR u.nome LIKE ? 
           OR u.cognome LIKE ?
           OR c.day_of_week LIKE ?
        ORDER BY c.day_of_week, c.time
      `;
      const searchPattern = `%${query}%`;
      this.db.all(sql, [searchPattern, searchPattern, searchPattern, searchPattern], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Ottiene le classi di un trainer
   * @param {number} trainerId - ID del trainer
   * @returns {Promise<Array>} - Array di classi
   */
  getClassesByTrainer(trainerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.* 
        FROM classes c 
        WHERE c.trainer_id = ?
        ORDER BY c.day_of_week, c.time
      `;
      this.db.all(sql, [trainerId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Crea una nuova classe
   * @param {Object} classData - Dati della classe
   * @returns {Promise<number>} - ID della nuova classe
   */
  createClass(classData) {
    return new Promise((resolve, reject) => {
      const { name, trainer_id, time, capacity, day_of_week, description } = classData;
      const sql = `
        INSERT INTO classes(name, trainer_id, time, capacity, day_of_week, description) 
        VALUES(?, ?, ?, ?, ?, ?)
      `;
      this.db.run(sql, [name, trainer_id, time, capacity, day_of_week, description], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Aggiorna una classe
   * @param {number} id - ID della classe
   * @param {Object} classData - Nuovi dati
   * @returns {Promise<boolean>}
   */
  updateClass(id, classData) {
    return new Promise((resolve, reject) => {
      const { name, trainer_id, time, capacity, day_of_week, description } = classData;
      const sql = `
        UPDATE classes 
        SET name = ?, trainer_id = ?, time = ?, capacity = ?, day_of_week = ?, description = ?
        WHERE id = ?
      `;
      this.db.run(sql, [name, trainer_id, time, capacity, day_of_week, description, id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Elimina una classe
   * @param {number} id - ID della classe
   * @returns {Promise<boolean>}
   */
  deleteClass(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM classes WHERE id = ?';
      this.db.run(sql, [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Conta i posti disponibili per una classe
   * @param {number} classId - ID della classe
   * @returns {Promise<Object>} - {capacity, booked, available}
   */
  getClassAvailability(classId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          c.capacity,
          COUNT(b.id) as booked
        FROM classes c
        LEFT JOIN bookings b ON c.id = b.class_id
        WHERE c.id = ?
        GROUP BY c.id
      `;
      this.db.get(sql, [classId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve({ error: 'Classe non trovata.' });
        } else {
          resolve({
            capacity: row.capacity,
            booked: row.booked,
            available: row.capacity - row.booked
          });
        }
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

module.exports = ClassDAO;