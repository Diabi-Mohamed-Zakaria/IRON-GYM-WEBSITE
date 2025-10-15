'use strict';

const sqlite = require('sqlite3');
const crypto = require('crypto');
const path = require('path');

class UserDAO {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'db', 'gym.db');
    this.db = new sqlite.Database(this.dbPath, (err) => {
      if (err) throw err;
    });
  }

  /**
   * Ottiene un utente tramite username
   * @param {string} username - Username dell'utente
   * @returns {Promise<Object>} - Oggetto utente
   */
  getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE username = ?';
      this.db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve(false); // Utente non trovato
        } else {
          const user = {
            id: row.id,
            username: row.username,
            nome: row.nome,
            cognome: row.cognome,
            role: row.role,
            email: row.email
          };
          resolve(user);
        }
      });
    });
  }

  /**
   * Ottiene un utente tramite ID
   * @param {number} id - ID dell'utente
   * @returns {Promise<Object>} - Oggetto utente
   */
  getUserById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE id = ?';
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve({ error: 'Utente non trovato.' });
        } else {
          const user = {
            id: row.id,
            username: row.username,
            nome: row.nome,
            cognome: row.cognome,
            role: row.role,
            email: row.email
          };
          resolve(user);
        }
      });
    });
  }

  /**
   * Ottiene le credenziali di un utente (per Passport)
   * @param {string} username - Username dell'utente
   * @returns {Promise<Object>} - Oggetto con id, hash e salt
   */
  getUser(username) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE username = ?';
      this.db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve(false);
        } else {
          const user = {
            id: row.id,
            username: row.username,
            nome: row.nome,
            cognome: row.cognome,
            role: row.role,
            email: row.email
          };
          // Salt e hash per la verifica password
          resolve({ user: user, hash: row.hash, salt: row.salt });
        }
      });
    });
  }

  /**
   * Crea un nuovo utente
   * @param {string} username - Username
   * @param {string} password - Password in chiaro
   * @param {string} role - Ruolo (admin/trainer/client)
   * @param {string} nome - Nome
   * @param {string} cognome - Cognome
   * @param {string} email - Email
   * @returns {Promise<number>} - ID del nuovo utente
   */
  createUser(username, password, role, nome, cognome, email) {
    return new Promise((resolve, reject) => {
      // Genera salt e hash per la password
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
        if (err) reject(err);

        const hash = hashedPassword.toString('hex');
        const sql = 'INSERT INTO users(username, hash, salt, role, nome, cognome, email) VALUES(?, ?, ?, ?, ?, ?, ?)';
        
        this.db.run(sql, [username, hash, salt, role, nome, cognome, email], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID); // Restituisce l'ID del nuovo utente
          }
        });
      });
    });
  }

  /**
   * Ottiene tutti gli utenti (per admin)
   * @returns {Promise<Array>} - Array di utenti
   */
  getAllUsers() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, username, nome, cognome, role, email FROM users';
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
   * Ottiene utenti per ruolo
   * @param {string} role - Ruolo (admin/trainer/client)
   * @returns {Promise<Array>} - Array di utenti
   */
  getUsersByRole(role) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, username, nome, cognome, role, email FROM users WHERE role = ?';
      this.db.all(sql, [role], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Cerca utenti per username o email
   * @param {string} query - Query di ricerca
   * @returns {Promise<Array>} - Array di utenti
   */
  searchUsers(query) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, username, nome, cognome, role, email 
        FROM users 
        WHERE username LIKE ? OR email LIKE ? OR nome LIKE ? OR cognome LIKE ?
        LIMIT 10
      `;
      const searchTerm = `%${query}%`;
      this.db.all(sql, [searchTerm, searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Elimina un utente
   * @param {number} id - ID dell'utente
   * @returns {Promise<boolean>}
   */
  deleteUser(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM users WHERE id = ?';
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
   * Chiude la connessione al database
   */
  close() {
    this.db.close();
  }
}

module.exports = UserDAO;