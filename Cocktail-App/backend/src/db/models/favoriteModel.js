const db = require("../knex"); // Knex bağlantı yolunu kendine göre ayarla

module.exports = {
  // Kullanıcının favorilerini getir (Detaylarıyla)
  getUserFavorites: (userId) => {
    return knex("user_favorites")
      .join("cocktails", "user_favorites.cocktail_id", "cocktails.cocktail_id")
      .select(
        "cocktails.cocktail_id",
        "cocktails.name",
        "cocktails.image_url",
        "cocktails.is_alcoholic",
        "user_favorites.created_at as favorited_at"
      )
      .where("user_favorites.user_id", userId)
      .orderBy("user_favorites.created_at", "desc");
  },

  // Tekil kontrol (Bu kokteyl favoride mi?)
  findFavorite: (userId, cocktailId) => {
    return knex("user_favorites")
      .where({ user_id: userId, cocktail_id: cocktailId })
      .first();
  },

  // Ekle
  addFavorite: (userId, cocktailId) => {
    return knex("user_favorites").insert({
      user_id: userId,
      cocktail_id: cocktailId,
    });
  },

  // Sil
  removeFavorite: (userId, cocktailId) => {
    return knex("user_favorites")
      .where({ user_id: userId, cocktail_id: cocktailId })
      .del();
  },
};
