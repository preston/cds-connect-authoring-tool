import path from 'path';

// Load the username/passwords that will be authenticated using the local authentication strategy
let usersFromConfig = {};
try {
  usersFromConfig = require(path.join(process.cwd(), 'config', 'local-users.json'));
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    console.log('No users specified.');
  }
}

export function findByUsername(name, cb, users=usersFromConfig) {
  const userNames = Object.keys(users);
  for (let i = 0; i < userNames.length; i++) {
    if (userNames[i] === name) {
      // Set up user object to mirror LDAP structure
      const user = { uid: userNames[i], password: users[userNames[i]] };
      return cb(null, user);
    }
  }
  return cb(null, null);
}
