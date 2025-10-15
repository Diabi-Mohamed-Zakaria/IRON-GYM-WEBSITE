'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class ReviewDAO {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'db', 'gym.db');
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) throw err;
    });
  }

  /**
   * Crea una nuova recensione
   * @param {Object} reviewData - Dati della recensione
   * @param {number} reviewData.user_id - ID dell'utente
   * @param {number} reviewData.trainer_id - ID del trainer (opzionale)
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.title - Titolo della recensione
   * @param {string} reviewData.comment - Commento della recensione
   * @param {string} reviewData.review_type - Tipo recensione ('gym' o 'trainer')
   * @returns {Promise<Object>} - Recensione creata con ID
   */
  createReview(reviewData) {
    return new Promise((resolve, reject) => {
      const { user_id, trainer_id, rating, title, comment, review_type } = reviewData;
      
      const sql = `
        INSERT INTO reviews (user_id, trainer_id, rating, title, comment, review_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [user_id, trainer_id, rating, title, comment, review_type], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...reviewData });
        }
      });
    });
  }

  /**
   * Recupera tutte le recensioni con informazioni utente
   * @returns {Promise<Array>} - Array di recensioni con dati utente
   */
  getAllReviews() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          r.*,
          u.nome,
          u.cognome,
          t.nome as trainer_nome,
          t.cognome as trainer_cognome
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN users t ON r.trainer_id = t.id
        ORDER BY r.created_at DESC
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
   * Recupera recensioni per tipo (gym o trainer)
   * @param {string} review_type - Tipo di recensione ('gym' o 'trainer')
   * @returns {Promise<Array>} - Array di recensioni del tipo specificato
   */
  getReviewsByType(review_type) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          r.*,
          u.nome,
          u.cognome,
          t.nome as trainer_nome,
          t.cognome as trainer_cognome
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN users t ON r.trainer_id = t.id
        WHERE r.review_type = ?
        ORDER BY r.created_at DESC
      `;
      
      this.db.all(sql, [review_type], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Recupera recensioni per trainer specifico
   * @param {number} trainer_id - ID del trainer
   * @returns {Promise<Array>} - Array di recensioni per il trainer
   */
  getReviewsByTrainer(trainer_id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          r.*,
          u.nome,
          u.cognome
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.trainer_id = ?
        ORDER BY r.created_at DESC
      `;
      
      this.db.all(sql, [trainer_id], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Calcola rating medio per trainer
   * @param {number} trainer_id - ID del trainer
   * @returns {Promise<Object>} - Oggetto con rating medio e numero totale recensioni
   */
  getAverageRatingByTrainer(trainer_id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_reviews
        FROM reviews 
        WHERE trainer_id = ?
      `;
      
      this.db.get(sql, [trainer_id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            average_rating: row.average_rating ? parseFloat(row.average_rating.toFixed(1)) : 0,
            total_reviews: row.total_reviews
          });
        }
      });
    });
  }

  /**
   * Calcola rating medio per la palestra
   * @returns {Promise<Object>} - Oggetto con rating medio e numero totale recensioni palestra
   */
  getAverageGymRating() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_reviews
        FROM reviews 
        WHERE review_type = 'gym'
      `;
      
      this.db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            average_rating: row.average_rating ? parseFloat(row.average_rating.toFixed(1)) : 0,
            total_reviews: row.total_reviews
          });
        }
      });
    });
  }

  /**
   * Verifica se un utente ha già recensito un trainer specifico
   * @param {number} user_id - ID dell'utente
   * @param {number} trainer_id - ID del trainer
   * @returns {Promise<boolean>} - True se l'utente ha già recensito il trainer
   */
  hasUserReviewedTrainer(user_id, trainer_id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count
        FROM reviews 
        WHERE user_id = ? AND trainer_id = ?
      `;
      
      this.db.get(sql, [user_id, trainer_id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });
  }

  /**
   * Elimina una recensione
   * @param {number} review_id - ID della recensione da eliminare
   * @returns {Promise<Object>} - Oggetto con indicazione se la recensione è stata eliminata
   */
  deleteReview(review_id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM reviews WHERE id = ?';
      
      this.db.run(sql, [review_id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes > 0 });
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

module.exports = ReviewDAO;