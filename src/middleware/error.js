export function notFound(req, res) { res.status(404).json({ error: 'Not found' }); }
export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || (err.name === 'MulterError' ? 400 : 500);
  res.status(status).json({ error: status === 500 ? 'Server error' : err.message });
}
