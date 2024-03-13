const getData = async (req, res, next, body) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error("Validation Failed");
      err.statusCode = 400;
      err.data = errors.array();
      throw err;
    }
    let response = await body(req, res, next);
    res.status(response.status).json(response.data);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export { getData };
