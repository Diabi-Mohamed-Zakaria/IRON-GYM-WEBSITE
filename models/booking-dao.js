'use strict';

const sqlite = require('sqlite3');
const path = require('path');

class BookingDAO {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'db', 'gym.db');
    this.db = new sqlite.Database(this.dbPath, (err) => {
      if (err) throw err;
    });
  }

  /**
   * Crea una nuova prenotazione
   * @param {number} userId - ID dell'utente
   * @param {number} classId - ID della classe
   * @returns {Promise<number>} - ID della prenotazione
   */
  createBooking(userId, classId) {
    return new Promise((resolve, reject) => {
      // Prima controlla se l'utente ha già prenotato questa classe
      const checkSql = 'SELECT * FROM bookings WHERE user_id = ? AND class_id = ?';
      this.db.get(checkSql, [userId, classId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          reject({ error: 'Hai già prenotato questa classe.' });
        } else {
          // Controlla disponibilità posti
          const availabilitySql = `
            SELECT 
              c.capacity,
              COUNT(b.id) as booked
            FROM classes c
            LEFT JOIN bookings b ON c.id = b.class_id
            WHERE c.id = ?
            GROUP BY c.id
          `;
          this.db.get(availabilitySql, [classId], (err, availability) => {
            if (err) {
              reject(err);
            } else if (!availability) {
              reject({ error: 'Classe non trovata.' });
            } else if (availability.booked >= availability.capacity) {
              reject({ error: 'Classe al completo.' });
            } else {
              // Crea la prenotazione
              const insertSql = 'INSERT INTO bookings(user_id, class_id, booking_date) VALUES(?, ?, datetime("now"))';
              this.db.run(insertSql, [userId, classId], function (err) {
                if (err) {
                  reject(err);
                } else {
                  resolve(this.lastID);
                }
              });
            }
          });
        }
      });
    });
  }

  /**
   * Ottiene tutte le prenotazioni di un utente
   * @param {number} userId - ID dell'utente
   * @returns {Promise<Array>} - Array di prenotazioni
   */
  getBookingsByUser(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          b.id,
          b.booking_date,
          c.name as class_name,
          c.time,
          c.day_of_week,
          c.description,
          u.nome as trainer_nome,
          u.cognome as trainer_cognome
        FROM bookings b
        JOIN classes c ON b.class_id = c.id
        LEFT JOIN users u ON c.trainer_id = u.id
        WHERE b.user_id = ?
        ORDER BY c.day_of_week, c.time
      `;
      this.db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Ottiene tutte le prenotazioni di una classe
   * @param {number} classId - ID della classe
   * @returns {Promise<Array>} - Array di prenotazioni
   */
  getBookingsByClass(classId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          b.id,
          b.booking_date,
          u.nome,
          u.cognome,
          u.email
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.class_id = ?
        ORDER BY b.booking_date DESC
      `;
      this.db.all(sql, [classId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Cancella una prenotazione
   * @param {number} bookingId - ID della prenotazione
   * @param {number} userId - ID dell'utente (per verifica proprietà)
   * @returns {Promise<boolean>}
   */
  deleteBooking(bookingId, userId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM bookings WHERE id = ? AND user_id = ?';
      this.db.run(sql, [bookingId, userId], function (err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject({ error: 'Prenotazione non trovata o non autorizzato.' });
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Verifica se un utente ha prenotato una classe
   * @param {number} userId - ID dell'utente
   * @param {number} classId - ID della classe
   * @returns {Promise<boolean>}
   */
  hasUserBookedClass(userId, classId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id FROM bookings WHERE user_id = ? AND class_id = ?';
      this.db.get(sql, [userId, classId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row !== undefined);
        }
      });
    });
  }

  /**
   * Ottiene tutte le prenotazioni (per admin)
   * @returns {Promise<Array>} - Array di tutte le prenotazioni
   */
  getAllBookings() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          b.id,
          b.booking_date,
          u.nome as user_nome,
          u.cognome as user_cognome,
          c.name as class_name,
          c.time,
          c.day_of_week
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN classes c ON b.class_id = c.id
        ORDER BY b.booking_date DESC
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
   * Conta il numero totale di prenotazioni di un utente
   * @param {number} userId - ID dell'utente
   * @returns {Promise<number>} - Numero di prenotazioni
   */
  countUserBookings(userId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as total FROM bookings WHERE user_id = ?';
      this.db.get(sql, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.total);
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

module.exports = BookingDAO;