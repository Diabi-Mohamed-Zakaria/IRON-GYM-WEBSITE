'use strict';

const sqlite = require('sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

class UserDAO {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'db', 'gym.db');
    this.db = new sqlite.Database(this.dbPath, (err) => {
      if (err) throw err;
    });
    // Salt rounds per bcrypt (più alto = più sicuro ma più lento)
    this.saltRounds = 12;
  }

  /**
   * Hasha una password usando bcrypt
   * @param {string} password - Password in chiaro
   * @returns {Promise<string>} - Password hashata
   */
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new Error('Errore durante l\'hashing della password');
    }
  }

  /**
   * Confronta una password in chiaro con una hashata
   * @param {string} password - Password in chiaro
   * @param {string} hashedPassword - Password hashata
   * @returns {Promise<boolean>} - True se le password coincidono
   */
  async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Errore durante il confronto delle password');
    }
  }

  /**
   * Verifica la password corrente di un utente
   * @param {number} userId - ID dell'utente
   * @param {string} currentPassword - Password corrente in chiaro
   * @returns {Promise<boolean>} - True se la password è corretta
   */
  async verifyCurrentPassword(userId, currentPassword) {
    try {
      const user = await this.getUserById(userId);
      if (user.error) {
        return false;
      }
      // Confronto diretto per progetto scolastico
      return currentPassword === user.password;
    } catch (error) {
      throw new Error('Errore durante la verifica della password: ' + error.message);
    }
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
            email: row.email,
            gender: row.gender
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
            email: row.email,
            gender: row.gender,
            password: row.password
          };
          resolve(user);
        }
      });
    });
  }

  /**
   * Ottiene le credenziali di un utente (per Passport)
   * @param {string} username - Username dell'utente
   * @returns {Promise<Object>} - Oggetto con id e password hashata
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
            email: row.email,
            gender: row.gender
          };
          // Password in chiaro (per progetto scolastico)
          resolve({ user: user, password: row.password });
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
   * @param {string} gender - Genere (male/female)
   * @returns {Promise<number>} - ID del nuovo utente
   */
  async createUser(username, password, role, nome, cognome, email, gender) {
    try {
      // Password in chiaro per progetto scolastico
      return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO users(username, password, role, nome, cognome, email, gender) VALUES(?, ?, ?, ?, ?, ?, ?)';
        
        this.db.run(sql, [username, password, role, nome, cognome, email, gender], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID); // Restituisce l'ID del nuovo utente
          }
        });
      });
    } catch (error) {
      throw new Error('Errore durante la creazione dell\'utente: ' + error.message);
    }
  }

  /**
   * Ottiene tutti gli utenti (per admin)
   * @returns {Promise<Array>} - Array di utenti
   */
  getAllUsers() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, username, nome, cognome, role, email, gender FROM users';
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
      const sql = 'SELECT id, username, nome, cognome, role, email, gender FROM users WHERE role = ?';
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
        SELECT id, username, nome, cognome, role, email, gender 
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
   * Aggiorna i dati di un utente
   * @param {number} id - ID dell'utente
   * @param {Object} userData - Dati da aggiornare
   * @returns {Promise<boolean>}
   */
  updateUser(id, userData) {
    return new Promise((resolve, reject) => {
      const { nome, cognome, email } = userData;
      const sql = 'UPDATE users SET nome = ?, cognome = ?, email = ? WHERE id = ?';
      
      this.db.run(sql, [nome, cognome, email, id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Aggiorna la password di un utente
   * @param {number} id - ID dell'utente
   * @param {string} newPassword - Nuova password in chiaro
   * @returns {Promise<boolean>}
   */
  async updatePassword(id, newPassword) {
    try {
      // Password in chiaro per progetto scolastico
      return new Promise((resolve, reject) => {
        const sql = 'UPDATE users SET password = ? WHERE id = ?';
        
        this.db.run(sql, [newPassword, id], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        });
      });
    } catch (error) {
      throw new Error('Errore durante l\'aggiornamento della password: ' + error.message);
    }
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