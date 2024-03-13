const user = (user) => {
  delete user.password;
  return user;
};

export default user;
