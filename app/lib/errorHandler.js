exports.catchError = (functions) => {
  return function(req, res, next) {
    return functions(req, res, next).catch(next);
  };
};
