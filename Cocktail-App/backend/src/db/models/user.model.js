const knexConfig = require("../../../knexfile.js").development;
const db = require("knex")(knexConfig);

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

module.exports = {
  findOrCreateUser,
};
