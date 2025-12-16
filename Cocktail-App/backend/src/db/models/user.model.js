const db = require("../knex");

/**
 * @desc    Finds a user by their Firebase UID. If they don't exist,
 * creates them in the local DB with 'is_pro: false'.
 * @param   {string} firebase_uid - The UID from Firebase Auth
 * @param   {string} email - The user's email
 * @returns {Promise<Object>} The user object from our database (with is_pro flag)
 */
const findOrCreateUser = async (firebase_uid, email) => {
  // 1. Check if the user already exists in our local DB
  const existingUser = await db("users")
    .where({ firebase_uid: firebase_uid })
    .first();

  // 2. If they exist, return them (with their current 'is_pro' status)
  if (existingUser) {
    return existingUser;
  }

  // 3. If they DON'T exist (new registration), create them
  // (The 'is_pro: false' default is set by our migration,
  // but we are explicit here for clarity)
  const newUser = {
    firebase_uid: firebase_uid,
    email: email,
    is_pro: false,
  };

  // 4. Insert the new user
  // '.returning("*")' is crucial for MSSQL to return the newly created object
  const [createdUser] = await db("users").insert(newUser).returning("*");

  // 5. Return the newly created user
  return createdUser;
};

// YENİ EKLENDİ (EKSİK 8)
/**
 * @desc    Updates a user's 'is_pro' status to true.
 * @param   {string} firebase_uid - The UID of the user to upgrade
 * @returns {Promise<Object>} The UPDATED user object (with is_pro: true)
 */
const upgradeUserToPro = async (firebase_uid) => {
  // 1. Find the user and update their 'is_pro' status to true
  // (Not: Knex 'update' varsayılan olarak etkilenen satır sayısını döndürür)
  await db("users")
    .where({ firebase_uid: firebase_uid })
    .update({ is_pro: true });

  // 2. 'update' komutu objeyi döndürmediği için,
  //    (şimdi güncellenmiş olan) kullanıcıyı tekrar 'select' (getir)
  //    ve frontend'e (Redux) göndermek için döndür.
  const updatedUser = await db("users")
    .where({ firebase_uid: firebase_uid })
    .first();

  return updatedUser;
};

module.exports = {
  findOrCreateUser,
  upgradeUserToPro,
};
