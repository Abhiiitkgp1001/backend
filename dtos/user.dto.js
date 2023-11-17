exports.user = (user) => {
  delete user.password;
  return user;
};
